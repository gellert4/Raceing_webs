# FLOWSTATE RACING — DROP 001 email activation

The storefront is wired for static GitHub Pages hosting through Web3Forms. The signup stays visibly closed until the key exists, so the live site never pretends to collect addresses when it cannot deliver them.

## One-time activation

1. Create a Web3Forms access key for the inbox that should receive DROP 001 access requests.
2. In GitHub open **Raceing_webs → Settings → Secrets and variables → Actions → New repository secret**.
3. Name the secret exactly `WEB3FORMS_ACCESS_KEY` and paste the access key as its value.
4. Re-run **Deploy FLOWSTATE RACING to GitHub Pages** or push any commit to `main`.
5. Test one signup on the live site in EN, HU and DE.

The build maps that repository secret to `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`. Web3Forms keys are designed for browser-side form submission; do not place unrelated private API keys in this variable.

## What each request sends

- email address
- selected site language
- explicit DROP 001 consent text/version
- UTC submission time
- website source label

Checkout remains disabled separately. Enabling the email list does not enable payments.
