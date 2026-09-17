// Standalone Cloudflare Worker. Secrets never enter the Next.js static build.
type Limiter = { limit(options: { key: string }): Promise<{ success: boolean }> };
export type Env = {
  ALLOWED_ORIGIN: string;
  SITE_URL: string;
  REGISTRATION_ENABLED: string;
  NOTICE_VERSION: string;
  BREVO_API_KEY: string;
  RATE_HASH_SECRET: string;
  BREVO_LIST_EN: string; BREVO_LIST_HU: string; BREVO_LIST_DE: string;
  BREVO_TEMPLATE_EN: string; BREVO_TEMPLATE_HU: string; BREVO_TEMPLATE_DE: string;
  IP_LIMITER: Limiter; EMAIL_LIMITER: Limiter;
};
const MAX_BYTES = 2048;
const languages = ["EN", "HU", "DE"] as const;
type Language = typeof languages[number];
export async function readPayload(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length")) > MAX_BYTES) throw new Error("too_large");
  if (!request.body) throw new Error("invalid");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  // Cap actual bytes too, including requests without Content-Length.
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    length += next.value.byteLength;
    if (length > MAX_BYTES) { await reader.cancel(); throw new Error("too_large"); }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("invalid");
  return data;
}
async function hash(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, "0")).join("");
}
const positiveId = (s: string) => /^\d+$/.test(s || "") && Number.isSafeInteger(Number(s)) && Number(s) > 0;
export async function handleRequest(request: Request, env: Env, send: typeof fetch = fetch): Promise<Response> {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Vary": "Origin" };
  const reply = (status: number, data: unknown) => Response.json(data, { status, headers });
  if (!env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) return reply(403, { error: "origin" });
  headers["Access-Control-Allow-Origin"] = env.ALLOWED_ORIGIN;
  if (new URL(request.url).pathname !== "/subscribe") return reply(404, { error: "not_found" });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...headers, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600" } });
  if (request.method !== "POST") { headers.Allow = "POST, OPTIONS"; return reply(405, { error: "method" }); }
  if (env.REGISTRATION_ENABLED !== "true" || !env.BREVO_API_KEY || !env.NOTICE_VERSION || !env.RATE_HASH_SECRET || !env.IP_LIMITER || !env.EMAIL_LIMITER) return reply(503, { error: "not_open" });
  let site: URL;
  try { site = new URL(env.SITE_URL); if (site.protocol !== "https:" || site.origin !== env.ALLOWED_ORIGIN) throw new Error(); }
  catch { return reply(503, { error: "configuration" }); }
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return reply(415, { error: "content_type" });
  try {
    const ip = request.headers.get("CF-Connecting-IP");
    if (!ip) return reply(403, { error: "client" });
    const day = new Date().toISOString().slice(0, 10);
    if (!(await env.IP_LIMITER.limit({ key: await hash(day + ":ip:" + ip, env.RATE_HASH_SECRET) })).success) { headers["Retry-After"] = "60"; return reply(429, { error: "rate" }); }
    let body: Record<string, unknown>;
    try { body = await readPayload(request); } catch (error) { return reply((error as Error).message === "too_large" ? 413 : 400, { error: "body" }); }
    if (typeof body.website === "string" && body.website.length) return reply(202, { status: "pending" });
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || body.consent !== true || body.noticeVersion !== env.NOTICE_VERSION || !languages.includes(body.language as Language)) return reply(400, { error: "validation" });
    if (!(await env.EMAIL_LIMITER.limit({ key: await hash(day + ":email:" + email, env.RATE_HASH_SECRET) })).success) { headers["Retry-After"] = "60"; return reply(429, { error: "rate" }); }
    const language = body.language as Language;
    const list = env[`BREVO_LIST_${language}`], template = env[`BREVO_TEMPLATE_${language}`];
    if (!positiveId(list) || !positiveId(template)) return reply(503, { error: "configuration" });
    const redirect = new URL(site.href.endsWith("/") ? site.href + "email-status/" : site.href + "/email-status/");
    const response = await send("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST", headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, includeListIds: [Number(list)], templateId: Number(template), redirectionUrl: redirect.href,
        attributes: { FSR_LANGUAGE: language, FSR_NOTICE: env.NOTICE_VERSION, FSR_REQUESTED_AT: new Date().toISOString() } }),
      signal: AbortSignal.timeout(8000),
    });
    // Identical outcome for existing/pending addresses. Never return provider details.
    if (!response.ok) {
      const detail = await response.json().catch(() => ({})) as { code?: string };
      if (response.status === 400 && detail.code === "duplicate_parameter") return reply(202, { status: "pending" });
      return reply(502, { error: "provider" });
    }
    return reply(202, { status: "pending" });
  } catch { return reply(503, { error: "unavailable" }); }
}
export default { fetch: (request: Request, env: Env) => handleRequest(request, env) };
