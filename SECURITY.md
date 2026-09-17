# Security posture

This is a pre-launch prototype, not a security certification.

- Waitlist collection and checkout fail closed. No email signup writes are accepted.
- No card data, secrets, personal exports or live credentials belong in Git.
- Cart restoration validates IDs, sizes, integer quantities and expiry. Client prices never authorize payment.
- Server/Worker middleware adds CSP, MIME sniffing protection, referrer policy, feature restrictions and HTTPS HSTS. It does not run on GitHub Pages; Pages controls static response headers.
- CSP still permits inline scripts/styles for the current SSR renderer. Nonce-based CSP is a remaining hardening item.
- No analytics or marketing SDKs. Hosting authentication cookies are outside storefront control.
- D1 schema/history is retained; do not rewrite applied migrations. Existing records need an owner-directed retention audit; none were exported or deleted.
- The standalone email Worker implements exact-origin validation, bounded JSON requests, validated consent/language, a honeypot, HMAC-hashed rate-limit keys and provider double opt-in. Provider keys stay in server secrets. Cloudflare rate limits are per location, not a global abuse guarantee.
- Before enabling signup: configure the provider, sender and templates; complete controller/processor notices; test actual confirmation, duplicate requests, unsubscribe and deletion. Automated tests mock delivery and do not prove inbox receipt. Add stronger bot controls if abuse warrants them.
- Before payments: server-side catalog totals, signed/idempotent webhooks, least privilege, audit logs and tested refund paths.

Report security issues privately using GitHub private vulnerability reporting if enabled. Do not post secrets or customer data in public issues.
