import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest, type Env } from "../services/email/worker.ts";
const env: Env = {
  ALLOWED_ORIGIN: "https://gellert4.github.io", SITE_URL: "https://gellert4.github.io/Raceing_webs/",
  REGISTRATION_ENABLED: "true", NOTICE_VERSION: "test-v1", BREVO_API_KEY: "test-only",
  RATE_HASH_SECRET: "test-hash-secret", BREVO_LIST_EN: "1", BREVO_LIST_HU: "2", BREVO_LIST_DE: "3",
  BREVO_TEMPLATE_EN: "4", BREVO_TEMPLATE_HU: "5", BREVO_TEMPLATE_DE: "6",
  IP_LIMITER: { limit: async () => ({ success: true }) }, EMAIL_LIMITER: { limit: async () => ({ success: true }) },
};
const payload = { email: "Rider@example.com", language: "DE", consent: true, noticeVersion: "test-v1", website: "" };
function request(body: unknown = payload, origin = env.ALLOWED_ORIGIN) {
  return new Request("https://email.example.com/subscribe", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1" }, body: JSON.stringify(body) });
}
const neverSend: typeof fetch = async () => { throw new Error("Provider should not be called"); };
test("rejects cross-origin, absent consent, stale notice and oversized bodies without sending", async () => {
  assert.equal((await handleRequest(request(payload, "https://untrusted.example"), env, neverSend)).status, 403);
  assert.equal((await handleRequest(request({ ...payload, consent: false }), env, neverSend)).status, 400);
  assert.equal((await handleRequest(request({ ...payload, noticeVersion: "old" }), env, neverSend)).status, 400);
  assert.equal((await handleRequest(request({ ...payload, email: "a".repeat(3000) }), env, neverSend)).status, 413);
});
test("fails closed when disabled or throttled", async () => {
  assert.equal((await handleRequest(request(), { ...env, REGISTRATION_ENABLED: "false" }, neverSend)).status, 503);
  const result = await handleRequest(request(), { ...env, EMAIL_LIMITER: { limit: async () => ({ success: false }) } }, neverSend);
  assert.equal(result.status, 429); assert.equal(result.headers.get("Retry-After"), "60");
});
test("German signup requests DOI with the correct language and server-owned redirect", async () => {
  let sent = 0;
  const send: typeof fetch = async (url, init) => {
    sent++; assert.equal(url, "https://api.brevo.com/v3/contacts/doubleOptinConfirmation");
    const body = JSON.parse(init!.body as string);
    assert.equal(body.email, "rider@example.com");
    assert.deepEqual(body.includeListIds, [3]); assert.equal(body.templateId, 6);
    assert.equal(body.redirectionUrl, "https://gellert4.github.io/Raceing_webs/email-status/");
    assert.equal(body.attributes.FSR_NOTICE, "test-v1");
    return Response.json({}, { status: 201 });
  };
  const result = await handleRequest(request(), env, send);
  assert.equal(result.status, 202); assert.deepEqual(await result.json(), { status: "pending" }); assert.equal(sent, 1);
});
test("provider failures never become a success or expose secrets", async () => {
  const result = await handleRequest(request(), env, async () => Response.json({ secret: "private" }, { status: 500 }));
  assert.equal(result.status, 502); assert.deepEqual(await result.json(), { error: "provider" });
});
