import { processMail, type MailEnv } from "../commerce/mail.ts";
import { commerce, type CommerceEnv } from "../commerce/worker.ts";
import { handleRequest, type Env as EmailEnv } from "../email/worker.ts";
import { business } from "../../config/business.ts";
import { scriptHashes } from "./generated-csp.ts";
type Env = CommerceEnv & EmailEnv & MailEnv & { ASSETS: Fetcher };
export default {
  async scheduled(_controller: ScheduledController, env: Env) { await processMail(env); },
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let response: Response;
    if (url.pathname === "/api/subscribe") {
      if (!business.legalName || !business.privacyContact || !business.policyReviewed) response = Response.json({ error: "not_open" }, { status: 503 });
      else { url.pathname = "/subscribe"; response = await handleRequest(new Request(url,request),{...env, ALLOWED_ORIGIN:new URL(business.siteUrl).origin, SITE_URL:business.siteUrl, NOTICE_VERSION:business.policyVersion}); }
    } else if (url.pathname.startsWith("/api/")) response = await commerce(request,env);
    else response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options","nosniff");
    headers.set("Referrer-Policy","strict-origin-when-cross-origin");
    headers.set("X-Frame-Options","DENY");
    headers.set("Permissions-Policy","camera=(), microphone=(), geolocation=(), payment=()");
    headers.set("Strict-Transport-Security","max-age=31536000");
    // Hashes come from the exact static export. Third-party scripts are not loaded.
    headers.set("Content-Security-Policy",`default-src 'self'; script-src 'self' ${scriptHashes.join(" ")}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`);
    if (url.pathname.startsWith("/api/")) headers.set("Cache-Control","no-store");
    else if (!url.pathname.startsWith("/_next/static/")) headers.set("Cache-Control","public, max-age=0, must-revalidate");
    return new Response(response.body,{status:response.status,headers});
  }
};
