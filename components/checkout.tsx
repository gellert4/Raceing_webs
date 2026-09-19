"use client";
import { useRef, useState } from "react";
import { business } from "@/config/business";
import { launch } from "@/lib/store-config";
import { sitePath } from "@/lib/paths";
import { useLanguage } from "@/components/language";
import type { CartItem } from "@/lib/cart";
const texts = {
  EN: { delivery:"Delivery option", terms:"I accept the terms and acknowledge this is a preorder with the stated delivery date.", button:"CONTINUE TO SECURE PAYMENT", error:"Checkout is unavailable. Please check your cart (maximum 5 of each size, 10 items total) and try again.", pending:"OPENING PAYMENT…", total:"Total including delivery", latest:"Latest agreed delivery", note:"Payment is in HUF. Your bank may convert currencies. Review and pay on Stripe; no payment is made by this button." },
  HU: { delivery:"Szállítási mód", terms:"Elfogadom az ÁSZF-et és tudomásul veszem, hogy a megadott szállítási idővel előrendelést adok le.", button:"TOVÁBB A BIZTONSÁGOS FIZETÉSHEZ", error:"A fizetés nem indítható. Ellenőrizd a kosarat (méretenként legfeljebb 5, összesen 10 termék), majd próbáld újra.", pending:"FIZETÉS MEGNYITÁSA…", total:"Végösszeg szállítással", latest:"Vállalt legkésőbbi kézbesítés", note:"A fizetés forintban történik. A bankod devizát válthat. A rendelést a Stripe oldalán ellenőrzöd és fizeted ki; ez a gomb még nem von le pénzt." },
  DE: { delivery:"Versandoption", terms:"Ich akzeptiere die AGB und bestätige die Vorbestellung mit dem angegebenen Liefertermin.", button:"WEITER ZUR SICHEREN ZAHLUNG", error:"Checkout nicht verfügbar. Bitte prüfe den Warenkorb (maximal 5 je Größe, insgesamt 10 Artikel) und versuche es erneut.", pending:"ZAHLUNG WIRD GEÖFFNET…", total:"Gesamtbetrag mit Versand", latest:"Spätester vereinbarter Liefertermin", note:"Die Zahlung erfolgt in HUF. Deine Bank kann Währungen umrechnen. Prüfe und bezahle bei Stripe; dieser Button löst noch keine Zahlung aus." }
};
export function Checkout({items,total}:{items:CartItem[];total:number}) {
  const {lang}=useLanguage(); const t=texts[lang];
  const [shipping,setShipping]=useState(0), [terms,setTerms]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState(false);
  const attempt=useRef<{fingerprint:string;id:string}|null>(null);
  if (!launch.checkoutEnabled) return null;
  const option=business.shipping[shipping];
  return <div className="checkout-box"><label>{t.delivery}<select value={shipping} onChange={e=>setShipping(Number(e.target.value))}>{business.shipping.map((s,i)=><option key={`${s.country}-${s.name}`} value={i}>{s.country} / {s.name} / {s.huf.toLocaleString()} HUF</option>)}</select></label><p>{business.deliveryStatement[lang]}</p><p>{t.latest}: {business.latestDeliveryDate}</p><p>{business.vatStatement[lang]}</p><strong>{t.total}: {(total+(option?.huf||0)).toLocaleString()} HUF</strong><label className="signup-consent"><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/><span>{t.terms} <a href={sitePath("/terms/")} target="_blank" rel="noopener">{lang==="HU"?"ÁSZF":lang==="DE"?"AGB":"Terms"}</a></span></label><button className="primary full" disabled={!terms||busy||!option} onClick={async()=>{
    if (busy) return; setBusy(true);setError(false);
    try {
      const data={items,country:option.country,shippingMethod:option.name,language:lang,terms,policyVersion:business.policyVersion};
      const fingerprint=JSON.stringify(data);
      if (attempt.current?.fingerprint!==fingerprint) attempt.current={fingerprint,id:crypto.randomUUID()};
      const r=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,requestId:attempt.current.id}),signal:AbortSignal.timeout(15000)});
      const result=await r.json() as {url?:string;error?:string};
      if(!r.ok||typeof result.url!=="string"||new URL(result.url).origin!=="https://checkout.stripe.com") { if(result.error==="new_attempt_required") attempt.current=null; throw Error(); }
      window.location.assign(result.url);
    }catch{setError(true);}finally{setBusy(false);}
  }}>{busy?t.pending:t.button}</button><small>{t.note}</small>{error&&<p role="alert">{t.error}</p>}</div>;
}
