# FLOWSTATE RACING

47°N European Division. Pre-launch motorcycle streetwear concept.

## Stack
Next.js App Router, React, TypeScript, Tailwind, shadcn primitives; Vinext/Vite builds for Cloudflare Workers. D1 migration retained. No active payment collection or signup.

## Development
Node >=22.13; use the pnpm version pinned in package.json.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
pnpm build
node --experimental-strip-types --test tests/*.test.ts
```

## Structure
- app/: storefront, legal pages and closed signup endpoint
- components/: UI primitives and shared legal/storage controls
- lib/: cart validation and launch gates
- public/: optimized campaign/product assets and brand artwork
- db/, drizzle/: D1 schema and immutable migration history
- docs/LAUNCH-CHECKLIST.md: owner decisions and launch blockers
- SECURITY.md: implemented protections and outstanding controls

## Collection
One hoodie, one tee, one jet-tag keychain. Stickers are supplementary artwork, not an extra launch SKU. All renders are AI concept visuals. Textile weights, composition, sizes and final prices need production verification. Do not claim brand sponsorship.

## Launch status
This is not a finished transactional shop. Payment, admin uploads, REP commissions and real 360° photography are not implemented. A standalone double-opt-in email integration is implemented and tested with a mocked provider, but requires Cloudflare/Brevo setup, verified sender, completed privacy information and real delivery/unsubscribe testing. Registration is intentionally closed until legal/controller details and consent lifecycle exist. Read the launch checklist before accepting registrations or orders.

## Deployment
The public preview is at https://gellert4.github.io/Raceing_webs/. The GitHub Pages workflow builds and deploys pushes to `main`; it also supports manual runs. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

The older Sites/Worker adapters remain in the repository but are not the public Pages deployment. Never commit credentials, database exports or customer records.

## Email setup
See [docs/EMAIL-SETUP.md](docs/EMAIL-SETUP.md). The frontend contains no provider API key. Signup stays disabled by default; configuring the provider and completing the launch gates is required before enabling it.

## Design
Black #050505, off-white #EFEFE9, racing red #ED271C. English is the default, with Hungarian and German selectors. The reflective hoodie is a future concept in the lookbook, separate from the three launch products; see [docs/REFLECTIVE-STUDY.md](docs/REFLECTIVE-STUDY.md). Print art requires production cleanup, color separation and supplier approval.
