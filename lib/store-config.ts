/** Launch switches are evaluated at build time for the static storefront. */
export const launch = {
  waitlistEnabled: Boolean(process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY),
  checkoutEnabled: false,
  legalVersion: "2026-09-16-drop001-consent-v1",
} as const;
