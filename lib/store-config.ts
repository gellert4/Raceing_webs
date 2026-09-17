/** Keep collection closed until controller details, consent and mail delivery are ready. */
export const launch = {
  waitlistEnabled: process.env.NEXT_PUBLIC_WAITLIST_ENABLED === "true" && !!process.env.NEXT_PUBLIC_WAITLIST_URL,
  waitlistUrl: process.env.NEXT_PUBLIC_WAITLIST_URL || "",
  checkoutEnabled: false,
  legalVersion: "2026-09-16-draft-3",
} as const;
