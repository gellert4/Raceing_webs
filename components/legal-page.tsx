import { sitePath } from "@/lib/paths";
import type { ReactNode } from "react";
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <main className="legal-page"><a className="legal-back" href={sitePath("/")}>← FLOWSTATE RACING</a><p className="eyebrow">PRE-LAUNCH / INDULÁS ELŐTT</p><h1>{title}</h1><p className="launch-notice">Sales and registration are closed. These pages describe the current preview, not a ready-to-trade business. / Az értékesítés és feliratkozás zárva. A vállalkozói adatok még hiányoznak.</p><section>{children}</section><nav className="legal-nav"><a href={sitePath("/terms")}>Terms / ÁSZF</a><a href={sitePath("/privacy")}>Privacy / Adatkezelés</a><a href={sitePath("/cookies")}>Cookies</a><a href={sitePath("/shipping")}>Shipping / Szállítás</a><a href={sitePath("/imprint")}>Imprint / Impresszum</a></nav></main>;
}
