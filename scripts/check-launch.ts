import { business, launchBlockers } from "../config/business.ts";
const missing = launchBlockers(business);
if (missing.length) { console.error("Launch blocked. Complete and verify:\n" + missing.map(x => `- ${x}`).join("\n")); process.exitCode = 1; }
else console.log("Configuration gates pass. Provider end-to-end tests and operational monitoring must also be in place.");
