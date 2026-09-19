# Production note (2026-09-19)
For the integrated production site use `services/site/wrangler.jsonc` and `docs/INDULAS-HU.md`. Its same-origin endpoint is `/api/subscribe`; it derives origin, site URL and notice version from `config/business.ts`. Worker secrets and Brevo list/template values belong in that production service. The production build must use `NEXT_PUBLIC_WAITLIST_URL=/api/subscribe`. The older standalone instructions below are retained for reference; do not deploy both email backends by accident. The Pages workflow now always disables signup.

The production Worker also sends order confirmations and withdrawal receipts through a separate durable transactional outbox. These are not marketing subscriptions. Configure `MAIL_FROM` and `TRANSACTIONAL_MAIL_ENABLED` separately, monitor errors/bounces, and test actual delivery. Queue acceptance is not proof of email delivery.

# FLOWSTATE email setup

Implemented: EN/HU/DE signup UI, explicit unchecked consent, bounded request bodies, origin checks, honeypot, per-IP and per-email throttling, Brevo double opt-in, separate language lists/templates, generic pending response and fail-closed errors. The static GitHub Pages site calls a separate Worker. No API secret is bundled into public JavaScript.

Status: implementation tested with mocked provider responses. No Brevo account, verified sender, API key, Cloudflare account or live delivery test is available in this workspace. Registration therefore remains closed. Payment is separate.

## Activation
1. In your own Brevo account, verify the sender/domain and create three marketing lists (EN/HU/DE). Add text contact attributes FSR_LANGUAGE, FSR_NOTICE, FSR_REQUESTED_AT. Keep provider DOI records; the last-request attributes alone are not a complete consent audit trail.
2. Create and activate three DOI templates using the text in templates.md and Brevo's actual double-opt-in confirmation link. Test that clicking adds the contact to the intended list. Every subsequent marketing campaign must contain Brevo's working unsubscribe link. Use Brevo's marketing campaign interface, which manages subscription suppression, instead of bulk transactional mail.
3. Fill the six list/template IDs in services/email/wrangler.jsonc. Keep REGISTRATION_ENABLED false while configuring. Ensure limiter namespace IDs are unique in your Cloudflare account.
4. Run from the repository root:

   pnpm exec wrangler login
   pnpm exec wrangler secret put BREVO_API_KEY --config services/email/wrangler.jsonc
   pnpm exec wrangler secret put RATE_HASH_SECRET --config services/email/wrangler.jsonc

   Use a random secret of at least 32 bytes for RATE_HASH_SECRET. Enter secrets interactively; never commit or paste them into chat.
5. Complete the actual controller identity/contact, retention period, rights/deletion contact and processor disclosures in the privacy notice. Replace the draft consent version in both lib/store-config.ts and Worker config. Preserve a dated copy of each published notice.
6. Deploy the Worker with pnpm exec wrangler deploy --config services/email/wrangler.jsonc. Use the returned HTTPS URL plus /subscribe as GitHub repository variable WAITLIST_URL. Set repository variable WAITLIST_ENABLED to true only after activation testing and changing REGISTRATION_ENABLED to true in the Worker.
7. Run the Pages workflow. Test with an address you control: submit, receive DOI, confirm, verify the correct list and language, send a test marketing email, unsubscribe, verify suppression, and exercise deletion in Brevo. Never send campaigns to unconfirmed/pending contacts.

## Operations
- Use Brevo to compose/schedule campaign emails, manage confirmed lists, unsubscribe and delete contacts. This repository does not create an inbox or invent an email sender address.
- No local email database is created by this Worker. Brevo holds signup/contact data. Worker code never logs request bodies, emails or provider secrets.
- Cloudflare limiter counters are local to each Cloudflare location, not globally exact. Shared IPs can be throttled; hashed email limits reduce duplicate attempts. Add provider quotas/alerts and bot protection if abuse warrants it.
- The public origin is checked exactly. CORS is not authentication, and requests can be spoofed outside browsers; the rate limit and DOI checks remain necessary.
- Provider timeout/failure is reported as unavailable, never as confirmed signup. A repeated pending response does not prove delivery.
- The previous Web3Forms mail-forwarding path is superseded. Its existing external records, if any, were not modified. Audit historical prototype records before reuse.
- Server-hosted variants must allow the exact Worker origin in connect-src; Pages does not apply middleware.ts.

References checked:
https://developers.brevo.com/reference/create-doi-contact
https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
