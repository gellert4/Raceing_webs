import { business } from "../../config/business.ts";
import { stripe, type CommerceEnv } from "./worker.ts";
export type MailEnv = CommerceEnv & { BREVO_API_KEY:string; TRANSACTIONAL_MAIL_ENABLED:string; MAIL_FROM:string };
const escape = (s:string) => s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
type Task={id:string;order_id:string;kind:string;attempts:number};
// Durable queue + leases tolerate retries. Provider acceptance is not proof of inbox delivery.
export async function processMail(env:MailEnv,send:typeof fetch=fetch) {
 if(env.TRANSACTIONAL_MAIL_ENABLED!=="true"||!env.BREVO_API_KEY||!env.MAIL_FROM||!env.DB)return;
 for(let i=0;i<10;i++){
  const now=Date.now();
  const task=await env.DB.prepare("UPDATE operations SET state='sending',lease_until=?,attempts=attempts+1 WHERE id=(SELECT id FROM operations WHERE kind IN ('contract_confirmation','withdrawal_receipt_and_review') AND state IN ('pending','sending') AND lease_until<=? AND attempts<10 ORDER BY created_at LIMIT 1) RETURNING *").bind(now+120000,now).first<Task>();
  if(!task)break;
  try{
   let email:string,subject:string,text:string;
   if(task.kind==="contract_confirmation"){
    const order=await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(task.order_id).first<{status:string;session_id:string;language:"EN"|"HU"|"DE";terms_snapshot:string;lines:string;subtotal:number;shipping:number}>();
    if(!order||order.status!=="paid") {await env.DB.prepare("UPDATE operations SET state='review' WHERE id=?").bind(task.id).run();continue;}
    const session=await stripe(`checkout/sessions/${order.session_id}`,env,send);
    if(session.payment_status!=="paid"||!session.customer_details?.email)throw Error("payment");
    email=session.customer_details.email;
    subject={EN:"FLOWSTATE RACING: order accepted",HU:"FLOWSTATE RACING: rendelés elfogadva",DE:"FLOWSTATE RACING: Bestellung angenommen"}[order.language];
    const lines=JSON.parse(order.lines) as {name:string;size:string;qty:number;unit:number}[];
    text=`${subject}\n${task.order_id}\n\n${lines.map(l=>`${l.qty} × ${l.name} / ${l.size}: ${l.unit*l.qty/100} HUF`).join("\n")}\nShipping / Szállítás / Versand: ${order.shipping/100} HUF\nTotal / Összesen / Gesamt: ${(order.subtotal+order.shipping)/100} HUF\n\n${order.terms_snapshot}`;
   }else{
    const w=await env.DB.prepare("SELECT * FROM withdrawals WHERE id=?").bind(task.order_id).first<{email:string;language:"EN"|"HU"|"DE";customer_name:string;order_reference:string;items:string;created_at:number}>();
    if(!w)throw Error("record");email=w.email;
    subject={EN:"FLOWSTATE RACING: withdrawal received",HU:"FLOWSTATE RACING: elállás beérkezett",DE:"FLOWSTATE RACING: Widerruf eingegangen"}[w.language];
    text=`${subject}\n${task.order_id}\n${new Date(w.created_at).toISOString()}\n\n${w.customer_name}\n${w.order_reference}\n${w.items}\n\n${business.email}`;
   }
   const response=await send("https://api.brevo.com/v3/smtp/email",{method:"POST",headers:{"api-key":env.BREVO_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({sender:{email:env.MAIL_FROM,name:"FLOWSTATE RACING"},to:[{email}],subject,textContent:text,htmlContent:`<html><body><pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escape(text)}</pre></body></html>`,headers:{"Idempotency-Key":task.id}}),signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error("provider");
   const statements=[env.DB.prepare("UPDATE operations SET state='done',completed_at=? WHERE id=?").bind(Date.now(),task.id)];
   if(task.kind==="withdrawal_receipt_and_review")statements.push(env.DB.prepare("UPDATE withdrawals SET receipt_status='accepted_by_provider' WHERE id=?").bind(task.order_id),env.DB.prepare("INSERT OR IGNORE INTO operations(id,order_id,kind,created_at) VALUES(?,?,?,?)").bind(`withdrawal_review:${task.order_id}`,task.order_id,"withdrawal_review",Date.now()));
   await env.DB.batch(statements);
  }catch{
   await env.DB.prepare("UPDATE operations SET state=?,lease_until=? WHERE id=?").bind(task.attempts>=10?"review":"pending",Date.now()+Math.min(3600000,60000*2**task.attempts),task.id).run();
  }
 }
}
