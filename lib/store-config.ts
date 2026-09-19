import { business, launchBlockers } from "../config/business";
/** Public switches cannot bypass the server-side launch checks. */
export const launch = {
  waitlistEnabled: process.env.NEXT_PUBLIC_WAITLIST_ENABLED === "true" && !!process.env.NEXT_PUBLIC_WAITLIST_URL && business.policyReviewed && !!business.privacyContact && !!business.legalName,
  waitlistUrl: process.env.NEXT_PUBLIC_WAITLIST_URL || "",
  checkoutEnabled: process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === "true" && launchBlockers().length === 0,
  withdrawalEnabled: process.env.NEXT_PUBLIC_WITHDRAWAL_ENABLED === "true",
  legalVersion: business.policyVersion,
} as const;
