# Security posture

This is a pre-launch prototype, not a security certification.

- Waitlist collection and checkout fail closed. No email signup writes are accepted.
- No card data, secrets, personal exports or live credentials belong in Git.
- Cart restoration validates IDs, sizes, integer quantities and expiry. Client prices never authorize payment.
- Security middleware adds CSP, MIME sniffing protection, referrer policy, feature restrictions and HTTPS HSTS.
- CSP still permits inline scripts/styles for the current SSR renderer. Nonce-based CSP is a remaining hardening item.
- No analytics or marketing SDKs. Hosting authentication cookies are outside storefront control.
- D1 schema/history is retained; do not rewrite applied migrations. Existing records need an owner-directed retention audit; none were exported or deleted.
- Before enabling public forms: origin validation, bounded JSON body, strict schema, durable throttling, bot controls, consent logging and verified email lifecycle.
- Before payments: server-side catalog totals, signed/idempotent webhooks, least privilege, audit logs and tested refund paths.

Report security issues privately using GitHub private vulnerability reporting if enabled. Do not post secrets or customer data in public issues.
