# Production launch checklist

Start with [INDULAS-HU.md](INDULAS-HU.md). Implementation status: Stripe checkout, signed webhooks, durable order/task storage, confirmation mail queue, online withdrawal and EN/HU/DE policy templates now exist. Provider connection, actual delivery and operational tests remain pending.

The current site is a pre-launch design preview, not a completed trading business.

- [ ] Trademark clearance: FLOWSTATE RACING / 47°N.
- [ ] Seller legal name, registered address, registry/tax IDs, support email and phone.
- [ ] Privacy controller, purposes/bases, processor contracts, transfers, retention and rights contact.
- [ ] Carrier, delivery territories, tax-inclusive prices, production dates and return address.
- [ ] HU/EU counsel review of EN/HU/DE terms, complaints, withdrawal and statutory remedies.
- [ ] Product samples, verified composition, care labels, measurements and GPSR traceability.
- [ ] Payment provider account. Server-priced checkout, verified signed webhooks, idempotent fulfillment, refunds and invoicing.
- [ ] Mail provider, explicit consent records, double opt-in, signed unsubscribe and deletion workflow.
- [ ] Durable rate limiting and bot protection before reopening signup. Do not simply flip the flag.
- [ ] Browser QA at mobile/desktop sizes, keyboard, 200% zoom; security header and CSP validation on final domain.
- [ ] Audit hosting/auth cookies on the final domain; tracking remains absent by default.

Optional later features (not needed for the first drop): private admin uploads, real 360° imagery, REP commissions. Keep them disabled until separately designed and tested.

- [ ] Move production commerce off GitHub Pages to the Cloudflare deployment.
- [ ] Backups/restore, retention, incident handling and pending/review queue monitoring.
- [ ] Test invoice issuance and shipping workflow; these remain operator tasks in this release.

Sources checked 2026-09-19:
- https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm
- https://europa.eu/youreurope/business/dealing-with-customers/data-protection/online-privacy/index_en.htm

Pre-order does not automatically mean bespoke/personalised goods. Do not exclude all returns.
