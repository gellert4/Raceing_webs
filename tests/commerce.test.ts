import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { priceCart } from "../services/commerce/catalog.ts";
import { commerce,hmac,verifySignature,type CommerceEnv } from "../services/commerce/worker.ts";
import { business,launchBlockers } from "../config/business.ts";
import { processMail } from "../services/commerce/mail.ts";
function database(){
 const db=new DatabaseSync(":memory:");db.exec(readFileSync(new URL("../services/commerce/migrations/0001_orders.sql",import.meta.url),"utf8"));
 const prepare=(sql:string)=>{let values:unknown[]=[];const statement={bind(...args:unknown[]){values=args;return statement},async first(){return db.prepare(sql).get(...values as never[])||null},async run(){db.prepare(sql).run(...values as never[]);return {success:true}}};return statement};
 const binding={prepare,async batch(statements:{run:()=>Promise<unknown>}[]){db.exec("BEGIN");try{for(const s of statements)await s.run();db.exec("COMMIT");return []}catch(e){db.exec("ROLLBACK");throw e}}};
 return {db,binding:binding as unknown as D1Database};
}
const id="f16de2f5-2673-4fa3-9ba1-1222e8ca2333";
test("authoritative prices ignore browser prices and reject duplicate/unknown variants",()=>{
 assert.equal(priceCart([{id:1,size:"M",qty:2,price:1}]).subtotal,3398000);
 for(const cart of [[{id:3,size:"M",qty:1}],[{id:1,size:"XS",qty:1}],[{id:4,size:"ONE SIZE",qty:0}],[{id:1,size:"M",qty:1},{id:1,size:"M",qty:1}]])assert.throws(()=>priceCart(cart));
 assert.ok(launchBlockers().includes("legalName"));assert.ok(launchBlockers().includes("productionDomain"));
});
test("webhook signature rejects tampering, stale signatures and malformed timestamps",async()=>{
 const raw='{"id":"evt_test"}',timestamp=Math.floor(Date.now()/1000),secret="whsec_test";
 const signature=`t=${timestamp},v1=${await hmac(`${timestamp}.${raw}`,secret)}`;
 assert.equal(await verifySignature(raw,signature,secret),true);
 assert.equal(await verifySignature(raw+" ",signature,secret),false);
 assert.equal(await verifySignature(raw,signature,secret,Date.now()+600000),false);
 assert.equal(await verifySignature(raw,`t=NaN,v1=${"a".repeat(64)}`,secret),false);
});
test("checkout, verified payment replay and outbox use a durable order; forged webhook cannot write",async()=>{
 const saved=structuredClone(business);const {db,binding}=database();
 try{
  for(const [key,value]of Object.entries(business)){
   if(typeof value==="string")Object.assign(business,{[key]:"configured"});
   else if(typeof value==="boolean")Object.assign(business,{[key]:true});
   else if(!Array.isArray(value))Object.assign(business,{[key]:{EN:"Configured terms",HU:"Feltételek",DE:"Bedingungen"}});
  }
  business.productInformation={1:{EN:"Cotton",HU:"Pamut",DE:"Baumwolle"},2:{EN:"Cotton",HU:"Pamut",DE:"Baumwolle"},4:{EN:"Tag",HU:"Kulcstartó",DE:"Anhänger"}};
  business.email="support@example.com";business.privacyContact="privacy@example.com";business.manufacturerEmail="maker@example.com";
  business.siteUrl="https://store.example.com/";business.policyVersion="2026-09-19";
  business.dropOpensAt=new Date(Date.now()-3600000).toISOString();business.dropClosesAt=new Date(Date.now()+86400000).toISOString();business.latestDeliveryDate=new Date(Date.now()+86400000*14).toISOString();
  business.shipping=[{country:"HU",name:"MPL",carrier:"MPL",huf:1990,minBusinessDays:1,maxBusinessDays:3}];
  assert.deepEqual(launchBlockers(),[]);
  const env:CommerceEnv={DB:binding,CHECKOUT_ENABLED:"true",STRIPE_SECRET_KEY:"sk_test_fake",STRIPE_WEBHOOK_SECRET:"whsec_test",STRIPE_MODE:"test",RATE_HASH_SECRET:"long-test-secret",API_LIMITER:{limit:async()=>({success:true})},WITHDRAWAL_ENABLED:"true"};
  const data={requestId:id,items:[{id:1,size:"M",qty:1,price:1}],language:"HU",country:"HU",shippingMethod:"MPL",terms:true,policyVersion:business.policyVersion};
  const request=(d=data,origin="https://store.example.com")=>new Request("https://store.example.com/api/checkout",{method:"POST",headers:{Origin:origin,"Content-Type":"application/json","CF-Connecting-IP":"203.0.113.1"},body:JSON.stringify(d)});
  let creates=0;
  const send=(async (_url:unknown,init?:RequestInit)=>{creates++;const p=new URLSearchParams(String(init?.body));assert.equal(p.get("line_items[0][price_data][unit_amount]"),"1699000");assert.equal(p.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"),"199000");return Response.json({id:"cs_test_session",url:"https://checkout.stripe.com/c/pay/test",livemode:false})})as typeof fetch;
  assert.equal((await commerce(request(data,"https://evil.example"),env,send)).status,403);
  assert.equal((await commerce(request(),{...env,CHECKOUT_ENABLED:"false"},send)).status,503);
  assert.equal((await commerce(request(),env,send)).status,200);
  assert.equal((await commerce(request(),env,send)).status,200);assert.equal(creates,1);
  assert.equal((await commerce(request({...data,items:[{id:1,size:"L",qty:1,price:1}]}),env,send)).status,409);
  const event={id:"evt_verified",type:"checkout.session.completed",livemode:false,data:{object:{id:"cs_test_session"}}};const raw=JSON.stringify(event),t=Math.floor(Date.now()/1000);
  const signed=await hmac(`${t}.${raw}`,env.STRIPE_WEBHOOK_SECRET);
  const hook=(sig=signed)=>new Request("https://store.example.com/api/stripe/webhook",{method:"POST",headers:{"stripe-signature":`t=${t},v1=${sig}`},body:raw});
  const session={id:"cs_test_session",client_reference_id:id,payment_status:"paid",livemode:false,mode:"payment",currency:"huf",amount_total:1898000,amount_subtotal:1699000,metadata:{order_id:id},shipping_details:{address:{country:"HU"}},payment_intent:"pi_test",customer_details:{email:"buyer@example.com"}};
  const retrieve=(async()=>Response.json(session))as typeof fetch;
  assert.equal((await commerce(hook("0".repeat(64)),env,retrieve)).status,400);
  assert.equal(db.prepare("SELECT count(*) AS n FROM payment_events").get()?.n,0);
  assert.equal((await commerce(hook(),env,retrieve)).status,200);assert.equal((await commerce(hook(),env,retrieve)).status,200);
  assert.equal(db.prepare("SELECT count(*) AS n FROM operations").get()?.n,3);
  assert.equal(db.prepare("SELECT status FROM orders WHERE id=?").get(id)?.status,"paid");
  const sent:string[]=[];
  await processMail({...env,BREVO_API_KEY:"test",MAIL_FROM:"sender@example.com",TRANSACTIONAL_MAIL_ENABLED:"true"},(async(url,init)=>{if(String(url).startsWith("https://api.stripe.com"))return Response.json(session);sent.push(String(init?.body));return Response.json({messageId:"mock"},{status:201})})as typeof fetch);
  assert.equal(sent.length,1);assert.match(sent[0],/Configured|Feltételek/);
  assert.equal(db.prepare("SELECT state FROM operations WHERE kind='contract_confirmation'").get()?.state,"done");
  const withdrawal={requestId:"a16de2f5-2673-4fa3-9ba1-1222e8ca2333",name:"Buyer",email:"buyer@example.com",order:id,items:"One tee",language:"HU",confirm:true};
  const withdrawRequest=()=>new Request("https://store.example.com/api/withdrawal",{method:"POST",headers:{Origin:"https://store.example.com","Content-Type":"application/json","CF-Connecting-IP":"203.0.113.1"},body:JSON.stringify(withdrawal)});
  // Closing sales must never disable withdrawal.
  assert.equal((await commerce(withdrawRequest(),{...env,CHECKOUT_ENABLED:"false"},send)).status,202);
  assert.equal((await commerce(withdrawRequest(),env,send)).status,202);
  assert.equal(db.prepare("SELECT count(*) AS n FROM withdrawals").get()?.n,1);
  await processMail({...env,BREVO_API_KEY:"test",MAIL_FROM:"sender@example.com",TRANSACTIONAL_MAIL_ENABLED:"true"},(async()=>new Response("Unavailable",{status:503}))as typeof fetch);
  assert.equal(db.prepare("SELECT state FROM operations WHERE kind='withdrawal_receipt_and_review'").get()?.state,"pending");
  assert.equal(db.prepare("SELECT receipt_status FROM withdrawals").get()?.receipt_status,"pending");
 }finally{Object.assign(business,saved);db.close();}
});
test("invalid paid totals are held for review instead of fulfillment",async()=>{
 const {db,binding}=database();
 db.prepare("INSERT INTO orders(id,request_hash,language,country,policy_version,lines,terms_snapshot,subtotal,shipping,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id,"hash","EN","HU","v1","[]","Terms",1000,0,1,1);
 const env={DB:binding,STRIPE_SECRET_KEY:"sk_test_fake",STRIPE_WEBHOOK_SECRET:"secret",STRIPE_MODE:"test"}as CommerceEnv;
 const raw=JSON.stringify({id:"evt_bad_total",livemode:false,type:"checkout.session.completed",data:{object:{id:"cs_test_wrong"}}});const t=Math.floor(Date.now()/1000);
 const req=new Request("https://store.example.com/api/stripe/webhook",{method:"POST",headers:{"stripe-signature":`t=${t},v1=${await hmac(`${t}.${raw}`,"secret")}`},body:raw});
 const r=await commerce(req,env,(async()=>Response.json({id:"cs_test_wrong",client_reference_id:id,payment_status:"paid",livemode:false,mode:"payment",currency:"huf",amount_total:1,amount_subtotal:1,metadata:{order_id:id}}))as typeof fetch);
 assert.equal(r.status,200);assert.equal(db.prepare("SELECT status FROM orders").get()?.status,"review");assert.equal(db.prepare("SELECT count(*) AS n FROM operations WHERE kind='fulfillment'").get()?.n,0);db.close();
});
