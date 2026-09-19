# Security posture

The public site is a closed pre-launch preview. The production implementation requires service configuration and end-to-end verification; this is not a security certification.

## Implemented
- Backend checkout gates: business configuration, separate server flag, drop dates and explicit accepted terms/version. Public build variables cannot turn the API on.
- Same-origin browser API; bounded request bodies; strict variant/quantity validation; no client-authoritative price, currency, redirect or delivery charge.
- Server-side Stripe Checkout with per-order idempotency, validated provider redirect, fixed HUF catalog, and rate limiting using HMAC IP identifiers. Card details stay at Stripe.
- Webhook raw-body HMAC signature and timestamp validation, mode matching, canonical provider payment retrieval, amount/currency/country validation and transactional D1 event/order/task writes. Duplicate events cannot create duplicate fulfillment tasks.
- Refund/dispute events flag review instead of silently shipping. Return URLs never mark orders paid. Sales closure does not disable webhooks or withdrawals.
- Durable mail queue, task leases and backoff. Transactional messages include the order-time terms snapshot. Failed mail is not reported as delivered; provider acceptance is distinguished from inbox delivery. Rare email duplicates after a provider/DB failure remain possible.
- Cloudflare production Worker applies HSTS, anti-framing, nosniff, referrer/permissions policies and CSP hashes generated from the actual static export. Inline styles remain allowed for the UI. GitHub Pages does not apply these headers and must not host production commerce.
- No public admin API, public customer lookup, tracker, payment SDK or customer database export. Operations use provider dashboards with MFA and restricted account roles.
- Newsletter remains double-opt-in, with explicit consent and separate language templates. No purchase-to-newsletter auto-enrolment.
- Parameterized SQL. Sensitive bodies, emails and secrets are not logged by application code. Cloudflare observability is disabled in the committed configuration.
- Frozen dependency lockfile, automated cart/email/commerce tests, Dependabot configuration. Secret/local database paths excluded from Git.

## Required before live traffic
- Verify final domain, provider KYC, production secret rotation, sender authentication, privacy terms and provider processing agreements.
- Test real payment success/failure/3DS, webhook retries/out-of-order/refund/dispute events, email confirmation and withdrawal receipt, suppression and deletion, invoice issuance and shipment operations.
- Inspect CSP and browser network on desktop and phone. Test generated CSP after every build; scripts/build-csp.mjs is part of production deployment.
- Configure D1 backup/restore and recovery tests, retention/deletion workflow, payment reconciliation and mail queue alerts. Database records are not automatically purged without a reviewed retention policy.
- Cloudflare rate limits are per location, not a global anti-abuse guarantee. CORS/Origin are not authentication. Add WAF/bot controls and provider quotas as appropriate; monitor rate limits and costs.
- Protect production environment and branch, enable secret scanning/push protection when available, use least-privilege deployment tokens.
- Invoice and carrier integrations are manual operational tasks in this release. Operators must check paid status, review flags, previous completion, refunds and shipment evidence before fulfilling once.
- The legacy Sites/SSR adapter remains separate; its middleware uses a broader script CSP. The production path is services/site/worker.ts, not that adapter.

Do not post credentials or customer records in issues. Use GitHub private vulnerability reporting if enabled; the operator must configure a real security contact before launch.
