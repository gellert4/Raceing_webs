# GitHub deployment

## Public preview (GitHub Pages)
1. Repository Settings → Pages → Build and deployment → Source: GitHub Actions.
2. Actions → Deploy public preview to GitHub Pages → Run workflow.
3. Confirm the deployment succeeds and open the URL returned by GitHub.

Expected address: https://gellert4.github.io/Raceing_webs/
This address has not been activated or verified by this handoff. Do not print the QR stickers until it is live and scanned from a phone.

The workflow is manual, so importing code does not silently publish the website. The source repository itself is public.

GitHub Pages serves a static preview: working local bag, catalog and legal pages, but no server routes, D1, payments, signup, admin or uploads. The same source retains the Worker build when STATIC_EXPORT is unset. HTTP security middleware applies only to a server/Worker deployment. GitHub Pages controls response headers; production commerce needs a server host and a new security review.

## Local static build
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/Raceing_webs pnpm exec next build

The static build uses Next.js directly and writes the `out/` directory. The normal `pnpm build` retains the Vinext Worker build.

## QR artwork
The QR destination is the expected Pages URL, not the private ChatGPT Sites URL. Regenerate if the destination changes. Prefer a domain you own before a large print run.
