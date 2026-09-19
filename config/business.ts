/** PUBLIC business facts only. Never put credentials or private home details here by default. */
export const business = {
  legalName: "", legalForm: "", address: "", registrationNumber: "", taxNumber: "",
  email: "", phone: "", returnAddress: "", complaintAddress: "",
  registrationAuthority: "", conciliationBody: "", conciliationContact: "",
  siteUrl: "", privacyContact: "", manufacturerName: "", manufacturerAddress: "", manufacturerEmail: "",
  vatStatement: { EN: "", HU: "", DE: "" },
  deliveryStatement: { EN: "", HU: "", DE: "" },
  retentionStatement: { EN: "", HU: "", DE: "" },
  // Confirm processor contracts, international transfers, subprocessors and actual retention first.
  processorStatement: { EN: "", HU: "", DE: "" },
  invoiceProvider: "", carrier: "", hostingProvider: "Cloudflare",
  policyVersion: "2026-09-19-draft-1",
  policyReviewed: false,
  productSamplesApproved: false,
  taxAndInvoicingVerified: false,
  confirmationAndWithdrawalTested: false,
  refundsAndFulfillmentTested: false,
  providerLiveAccountApproved: false,
  productionSecurityReviewed: false,
  dropOpensAt: "", dropClosesAt: "",
  // A real agreed latest delivery date must be shown before payment.
  latestDeliveryDate: "",
  // Confirmed composition, measurements, care and applicable safety information per product/language.
  productInformation: {
    1: { EN: "", HU: "", DE: "" },
    2: { EN: "", HU: "", DE: "" },
    4: { EN: "", HU: "", DE: "" },
  },
  // HUF major units. Null means NOT CONFIGURED, never free shipping by accident.
  shipping: [] as { country: string; name: string; carrier: string; huf: number; minBusinessDays: number; maxBusinessDays: number }[],
};

export function launchBlockers(c = business, now = Date.now()): string[] {
  const blockers: string[] = [];
  for (const key of ["legalName", "legalForm", "address", "registrationNumber", "taxNumber", "email", "phone", "returnAddress", "complaintAddress", "registrationAuthority", "conciliationBody", "conciliationContact", "privacyContact", "manufacturerName", "manufacturerAddress", "manufacturerEmail", "invoiceProvider", "carrier"] as const)
    if (!c[key].trim()) blockers.push(key);
  for (const key of ["vatStatement", "deliveryStatement", "retentionStatement", "processorStatement"] as const)
    if (["EN", "HU", "DE"].some(lang => !c[key][lang as "EN"].trim())) blockers.push(key);
  for (const key of ["policyReviewed", "productSamplesApproved", "taxAndInvoicingVerified", "confirmationAndWithdrawalTested", "refundsAndFulfillmentTested", "providerLiveAccountApproved", "productionSecurityReviewed"] as const)
    if (!c[key]) blockers.push(key);
  try { const url = new URL(c.siteUrl); if (url.protocol !== "https:" || url.hostname.endsWith("github.io") || url.username || url.password || url.pathname !== "/") blockers.push("productionDomain"); } catch { blockers.push("productionDomain"); }
  const opens = Date.parse(c.dropOpensAt), closes = Date.parse(c.dropClosesAt), delivery = Date.parse(c.latestDeliveryDate);
  if (!Number.isFinite(opens) || !Number.isFinite(closes) || opens >= closes) blockers.push("dropDates");
  if (!Number.isFinite(delivery) || delivery <= closes || delivery <= now) blockers.push("deliveryDate");
  const eu = "AT BE BG HR CY CZ DE DK EE ES FI FR GR HU IE IT LT LU LV MT NL PL PT RO SE SI SK".split(" ");
  if (!c.shipping.length || c.shipping.some(s => !eu.includes(s.country) || !s.name || !s.carrier || !Number.isSafeInteger(s.huf) || s.huf < 0 || !Number.isSafeInteger(s.minBusinessDays) || !Number.isSafeInteger(s.maxBusinessDays) || s.minBusinessDays < 1 || s.maxBusinessDays < s.minBusinessDays)) blockers.push("shipping");
  if (!c.policyVersion || c.policyVersion.includes("draft")) blockers.push("policyVersion");
  if (Object.values(c.productInformation).some(p => [p.EN,p.HU,p.DE].some(v => !v?.trim()))) blockers.push("productInformation");
  for (const key of ["email","privacyContact","manufacturerEmail"] as const) if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(c[key])) blockers.push(`${key}Format`);
  return blockers;
}
