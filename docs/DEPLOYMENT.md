# GitHub deployment

## Public preview (GitHub Pages)
Live preview: https://gellert4.github.io/Raceing_webs/

Repository Settings → Pages → Source must be GitHub Actions. Pushes to `main` run `.github/workflows/pages.yml`, test the cart and email handler, build the static site and deploy it. For a manual retry, open Actions → Deploy FLOWSTATE RACING to GitHub Pages → Run workflow. Check the deployment result before assuming new changes are live.

GitHub Pages serves a static preview with catalog, local cart, language selection and draft legal pages. It cannot execute API routes, process payments or run the email Worker. The standalone email integration is deployed separately as documented in EMAIL-SETUP.md and remains disabled until configured.

Security middleware applies to server/Worker hosting, not the static Pages files. GitHub Pages controls response headers. Commerce requires server-side payment handling and review before activation.

## Local static build
```sh
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/Raceing_webs pnpm exec next build
```
The output is `out/`. The normal `pnpm build` retains the older Vinext Worker build.

## QR artwork
The saved QR artwork remains a production proof; it is no longer a storefront section. Scan a physical test print before production. Regenerate the code if its destination changes; prefer a domain you own before a large print run.
