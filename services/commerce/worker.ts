import { business, launchBlockers } from "../../config/business.ts";
import { durableTerms } from "../../lib/policies.ts";
import { priceCart } from "./catalog.ts";
type Limiter = { limit(options: { key: string }): Promise<{ success: boolean }> };
export type CommerceEnv = {
  DB: D1Database; CHECKOUT_ENABLED: string; STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string; STRIPE_MODE: string; RATE_HASH_SECRET: string;
  API_LIMITER: Limiter; WITHDRAWAL_ENABLED: string;
};
export async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, "0")).join("");
}
export async function verifySignature(raw: string, header: string, secret: string, now = Date.now()) {
  const parts = header.split(",").map(x => x.trim().split("="));
  const times = parts.filter(([k]) => k === "t");
  if (times.length !== 1 || !/^\d+$/.test(times[0][1] || "")) return false;
  const timestamp = Number(times[0][1]);
  if (Math.abs(now / 1000 - timestamp) > 300) return false;
  const expected = await hmac(`${timestamp}.${raw}`, secret);
  return parts.filter(([k]) => k === "v1").some(([,value]) => {
    if (!/^[a-f0-9]{64}$/.test(value || "")) return false;
    let different = 0;
    for (let i = 0; i < 64; i++) different |= expected.charCodeAt(i) ^ value.charCodeAt(i);
    return different === 0;
  });
}
export async function boundedText(request: Request, max = 8192) {
  if (Number(request.headers.get("content-length")) > max || !request.body) throw Error("body");
  const reader = request.body.getReader(); let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const r = await reader.read(); if (r.done) break; size += r.value.length; if (size > max) { await reader.cancel(); throw Error("body"); } chunks.push(r.value); }
  const all = new Uint8Array(size); let offset = 0;
  for (const c of chunks) { all.set(c, offset); offset += c.length; }
  return new TextDecoder("utf-8", { fatal: true }).decode(all);
}
type Order = { id: string; request_hash: string; session_id: string | null; checkout_url: string | null; subtotal: number; shipping: number; status: string; country: string; created_at: number };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reply = (status: number, data: unknown) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
export async function stripe(path: string, env: CommerceEnv, send: typeof fetch, body?: URLSearchParams, key?: string) {
  const r = await send(`https://api.stripe.com/v1/${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Stripe-Version": "2024-06-20", ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, body, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw Error("provider");
  return r.json() as Promise<{id:string;url:string;client_reference_id:string;payment_status:string;livemode:boolean;mode:string;currency:string;amount_total:number;amount_subtotal:number;metadata:{order_id:string};shipping_details?:{address?:{country?:string}};payment_intent:string;customer_details?:{email?:string}}>;
}
export async function commerce(request: Request, env: CommerceEnv, send: typeof fetch = fetch): Promise<Response> {
  const path = new URL(request.url).pathname;
  try {
    if (path === "/api/stripe/webhook") {
      // Webhooks keep working when sales are disabled. Never depend on browser Origin.
      if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY || !env.DB || !["test", "live"].includes(env.STRIPE_MODE)) return reply(503, { error: "not_configured" });
      if (request.method !== "POST") return reply(405, { error: "method" });
      let raw: string; try { raw = await boundedText(request, 262144); } catch { return reply(413, { error: "body" }); }
      if (!await verifySignature(raw, request.headers.get("stripe-signature") || "", env.STRIPE_WEBHOOK_SECRET)) return reply(400, { error: "signature" });
      let event; try { event = JSON.parse(raw); } catch { return reply(400, { error: "body" }); }
      if (typeof event.id !== "string" || !event.id.startsWith("evt_") || event.livemode !== (env.STRIPE_MODE === "live")) return reply(400, { error: "event" });
      if (await env.DB.prepare("SELECT id FROM payment_events WHERE id=?").bind(event.id).first()) return reply(200, { received: true });
      const obj = event.data?.object;
      const time = Date.now();
      const log = env.DB.prepare("INSERT OR IGNORE INTO payment_events(id,type,object_id,received_at) VALUES(?,?,?,?)").bind(event.id, event.type, obj?.id || "unknown", time);
      if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
        if (!/^cs_[a-zA-Z0-9_]+$/.test(obj?.id || "")) return reply(400, { error: "session" });
        // Fetch canonical state; never ship from a redirect or an unverified event payload.
        const session = await stripe(`checkout/sessions/${obj.id}`, env, send);
        const order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(session.client_reference_id || "").first<Order>();
        if (!order) return reply(409, { error: "unknown_order" });
        if (order.session_id && order.session_id !== session.id) return reply(409, { error: "session_mismatch" });
        if (session.payment_status !== "paid") { await log.run(); return reply(200, { received: true }); }
        const valid = session.livemode === (env.STRIPE_MODE === "live") && session.mode === "payment" && session.currency === "huf" && session.amount_total === order.subtotal + order.shipping && session.amount_subtotal === order.subtotal && session.metadata?.order_id === order.id && session.shipping_details?.address?.country === order.country;
        if (!valid) {
          await env.DB.batch([log, env.DB.prepare("UPDATE orders SET status='review',updated_at=? WHERE id=?").bind(time, order.id), env.DB.prepare("INSERT OR IGNORE INTO operations(id,order_id,kind,created_at) VALUES(?,?,?,?)").bind(`review:${order.id}`, order.id, "payment_review", time)]);
          return reply(200, { received: true });
        }
        await env.DB.batch([log,
          env.DB.prepare("UPDATE orders SET status=CASE WHEN status='pending' THEN 'paid' ELSE status END, session_id=?,payment_intent=?,updated_at=? WHERE id=?").bind(session.id, session.payment_intent, time, order.id),
          ...["contract_confirmation", "tax_invoice", "fulfillment"].map(kind => env.DB.prepare("INSERT OR IGNORE INTO operations(id,order_id,kind,created_at) VALUES(?,?,?,?)").bind(`${kind}:${order.id}`, order.id, kind, time))]);
      } else if (["charge.refunded", "charge.dispute.created"].includes(event.type)) {
        // Never mark a refund complete from an event alone; operator reconciles in Stripe.
        let intent = obj?.payment_intent;
        if (!intent && typeof obj?.charge === "string" && /^ch_[a-zA-Z0-9]+$/.test(obj.charge)) intent = (await stripe(`charges/${obj.charge}`, env, send)).payment_intent;
        if (typeof intent !== "string") return reply(400, { error: "payment" });
        const order = await env.DB.prepare("SELECT * FROM orders WHERE payment_intent=?").bind(intent).first<Order>();
        if (!order) return reply(409, { error: "unknown_order" });
        await env.DB.batch([log, env.DB.prepare("UPDATE orders SET status='review',updated_at=? WHERE id=?").bind(time,order.id), env.DB.prepare("INSERT OR IGNORE INTO operations(id,order_id,kind,created_at) VALUES(?,?,?,?)").bind(`review:${event.id}`,order.id,event.type,time)]);
      } else { await log.run(); }
      return reply(200, { received: true });
    }
    if (!["/api/checkout", "/api/withdrawal"].includes(path)) return reply(404, { error: "not_found" });
    if (request.method !== "POST") return reply(405, { error: "method" });
    let origin: string; try { origin = new URL(business.siteUrl).origin; } catch { return reply(503, { error: "not_open" }); }
    if (request.headers.get("Origin") !== origin || new URL(request.url).origin !== origin) return reply(403, { error: "origin" });
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return reply(415, { error: "content_type" });
    if (!env.DB || !env.API_LIMITER || !env.RATE_HASH_SECRET) return reply(503, { error: "not_configured" });
    const ip = request.headers.get("CF-Connecting-IP");
    if (!ip) return reply(403, { error: "client" });
    if (!(await env.API_LIMITER.limit({ key: await hmac(new Date().toISOString().slice(0,10) + ip, env.RATE_HASH_SECRET) })).success) return reply(429, { error: "rate" });
    let body; try { body = JSON.parse(await boundedText(request)); } catch { return reply(400, { error: "body" }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return reply(400, { error: "body" });
    if (path === "/api/withdrawal") {
      // Independent of the drop window: withdrawal remains available after sales close.
      if (env.WITHDRAWAL_ENABLED !== "true") return reply(503, { error: "not_open" });
      if (body.confirm !== true || !["EN","HU","DE"].includes(body.language) || !uuid.test(body.requestId || "") || typeof body.name !== "string" || !body.name.trim() || body.name.length > 150 || typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(body.email) || typeof body.order !== "string" || !body.order.trim() || body.order.length > 150 || typeof body.items !== "string" || !body.items.trim() || body.items.length > 1500) return reply(400, { error: "validation" });
      const time = Date.now();
      await env.DB.batch([env.DB.prepare("INSERT OR IGNORE INTO withdrawals(id,order_reference,customer_name,email,items,language,created_at) VALUES(?,?,?,?,?,?,?)").bind(body.requestId,body.order.trim(),body.name.trim(),body.email.trim(),body.items.trim(),body.language,time),env.DB.prepare("INSERT OR IGNORE INTO operations(id,order_id,kind,created_at) VALUES(?,?,?,?)").bind(`withdrawal:${body.requestId}`,body.requestId,"withdrawal_receipt_and_review",time)]);
      return reply(202, { reference: body.requestId, status: "received" });
    }
    if (env.CHECKOUT_ENABLED !== "true" || launchBlockers().length || !["test","live"].includes(env.STRIPE_MODE) || !(env.STRIPE_SECRET_KEY || "").startsWith(`sk_${env.STRIPE_MODE}_`) || !env.STRIPE_WEBHOOK_SECRET) return reply(503, { error: "not_open" });
    const now = Date.now();
    if (now < Date.parse(business.dropOpensAt) || now >= Date.parse(business.dropClosesAt) - 30*60*1000) return reply(409, { error: "drop_closed" });
    if (!uuid.test(body.requestId || "") || body.terms !== true || body.policyVersion !== business.policyVersion || !["EN","HU","DE"].includes(body.language)) return reply(400, { error: "validation" });
    const shipping = business.shipping.find(s => s.country === body.country && s.name === body.shippingMethod);
    if (!shipping) return reply(400, { error: "shipping" });
    let priced; try { priced = priceCart(body.items); } catch { return reply(400, { error: "cart" }); }
    const payload = JSON.stringify({ ...priced, country: body.country, shipping: shipping.huf * 100, shippingMethod: shipping.name, language: body.language, policyVersion: body.policyVersion });
    const hash = await hmac(payload, env.RATE_HASH_SECRET);
    await env.DB.prepare("INSERT OR IGNORE INTO orders(id,request_hash,language,country,policy_version,lines,terms_snapshot,subtotal,shipping,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(body.requestId,hash,body.language,body.country,body.policyVersion,JSON.stringify(priced.lines),durableTerms(body.language),priced.subtotal,shipping.huf*100,now,now).run();
    const order = await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(body.requestId).first<Order>();
    if (!order || order.request_hash !== hash) return reply(409, { error: "request_conflict" });
    if (order.status !== "pending" || now - order.created_at > 23*60*60*1000) return reply(409, { error: "new_attempt_required" });
    if (order.checkout_url) return reply(200, { url: order.checkout_url });
    const params = new URLSearchParams({ mode: "payment", "payment_method_types[0]": "card", "currency": "huf", locale: body.language.toLowerCase(), client_reference_id: order.id, "metadata[order_id]": order.id, "metadata[policy_version]": business.policyVersion,
      success_url: `${origin}/checkout-result/`, cancel_url: `${origin}/#drop`, billing_address_collection: "required", "consent_collection[terms_of_service]": "required", "shipping_address_collection[allowed_countries][0]": body.country,
      expires_at: String(Math.min(Math.floor(order.created_at/1000)+3600, Math.floor(Date.parse(business.dropClosesAt)/1000))),
      "custom_text[submit][message]": `${business.deliveryStatement[body.language as "EN"]} ${business.vatStatement[body.language as "EN"]}`,
      "shipping_options[0][shipping_rate_data][type]": "fixed_amount", "shipping_options[0][shipping_rate_data][display_name]": shipping.name,
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]": "huf", "shipping_options[0][shipping_rate_data][fixed_amount][amount]": String(shipping.huf*100) });
    priced.lines.forEach((line,i) => { params.set(`line_items[${i}][price_data][currency]`,"huf"); params.set(`line_items[${i}][price_data][unit_amount]`,String(line.unit)); params.set(`line_items[${i}][price_data][product_data][name]`,`${line.name} / ${line.size}`); params.set(`line_items[${i}][quantity]`,String(line.qty)); });
    const session = await stripe("checkout/sessions",env,send,params,`checkout:${order.id}`);
    if (typeof session.url !== "string" || new URL(session.url).origin !== "https://checkout.stripe.com" || session.livemode !== (env.STRIPE_MODE === "live")) throw Error("provider");
    await env.DB.prepare("UPDATE orders SET session_id=?,checkout_url=?,updated_at=? WHERE id=?").bind(session.id,session.url,now,order.id).run();
    return reply(200, { url: session.url });
  } catch { return reply(503, { error: "unavailable" }); }
}
