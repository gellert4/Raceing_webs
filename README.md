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
node --experimental-strip-types --test tests/cart.test.ts
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
This is not a finished transactional shop. Payment, verified email lifecycle, admin uploads, REP commissions and real 360° photography are not implemented. Registration is intentionally closed until legal/controller details and consent lifecycle exist. Read the launch checklist before making the site public.

## Deployment
For the included manual GitHub Pages workflow, follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The static preview build has been verified locally; public hosting still needs activation.

The existing private Sites deployment uses .openai/hosting.json and the bundled build adapter. This repository does not automatically deploy just because code is pushed. An independent Cloudflare deployment needs account bindings and deployment setup. Never commit .env files, credentials, database exports or customer records.

## Design
Black #050505, off-white #EFEFE9, racing red #ED271C. Hoodie back graphic: DISCIPLINE / INSTINCT / FLOW. Generated concept assets are in public/. Print art requires production cleanup, color separation and supplier approval.
