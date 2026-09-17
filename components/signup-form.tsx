"use client";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/components/language";
import { ui } from "@/lib/translations";
import { launch } from "@/lib/store-config";
import { sitePath } from "@/lib/paths";

export function SignupForm({ labels }: { labels: { email: string; join: string } }) {
  const { lang } = useLanguage();
  const t = ui[lang];
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "rate">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!launch.waitlistEnabled || status === "sending") return;
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    try {
      const response = await fetch(launch.waitlistUrl, {
        method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), language: lang, consent: form.get("consent") === "yes", website: form.get("website") || "", noticeVersion: launch.legalVersion }),
        signal: AbortSignal.timeout(12000),
      });
      if (response.status === 429) { setStatus("rate"); return; }
      if (!response.ok) throw new Error("Request failed");
      const result = await response.json() as { status?: string };
      if (result.status !== "pending") throw new Error("Invalid response");
      setStatus("sent");
    } catch { setStatus("error"); }
  }
  if (!launch.waitlistEnabled) return <p className="launch-notice">{t.closed}</p>;
  if (status === "sent") return <div className="signup-success" role="status"><h3>{t.checkInbox}</h3><p>{t.inbox}</p></div>;
  return <form className="signup-form" onSubmit={submit} aria-busy={status === "sending"}>
    <label htmlFor="signup-email">{labels.email}</label>
    <div className="signup-input-row"><input id="signup-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required disabled={status === "sending"}/><button className="primary" disabled={status === "sending"}>{status === "sending" ? t.sending : labels.join}</button></div>
    <label className="signup-consent"><input name="consent" type="checkbox" value="yes" required disabled={status === "sending"}/><span>{t.consent}</span></label>
    <a className="signup-privacy" href={sitePath("/privacy/")}>{t.privacyLink}</a>
    <div className="honeypot" aria-hidden="true"><label htmlFor="signup-website">Website</label><input id="signup-website" name="website" type="text" tabIndex={-1} autoComplete="off"/></div>
    {(status === "error" || status === "rate") && <p className="form-error" role="alert">{status === "rate" ? t.signupRate : t.signupError}</p>}
  </form>;
}
