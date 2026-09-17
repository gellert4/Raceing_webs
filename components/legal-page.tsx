"use client";
import { sitePath } from "@/lib/paths";
import { LanguageSwitcher, useLanguage } from "@/components/language";
import { legalDe } from "@/lib/legal-de";
import { ui } from "@/lib/translations";
import { StorageSettings } from "@/components/storage-settings";
import type { ReactNode } from "react";
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { lang } = useLanguage();
  const german = lang === "DE" ? legalDe[title] : null;
  const notice = { EN: "Pre-launch draft. Sales and registration remain closed. Operator details and final terms are still pending.", HU: "Indulás előtti tervezet. Az értékesítés és feliratkozás zárva. Az üzemeltetői adatok és a végleges feltételek még hiányoznak.", DE: "Entwurf vor dem Start. Verkauf und Anmeldung sind geschlossen. Betreiberdaten und endgültige Bedingungen stehen noch aus." }[lang];
  return <main className="legal-page"><div className="legal-toolbar"><a className="legal-back" href={sitePath("/")}>← FLOWSTATE RACING</a><LanguageSwitcher/></div><p className="eyebrow">47°N / EUROPEAN DIVISION</p><h1>{german?.title || title}</h1><p className="launch-notice">{notice}</p><section>{german ? <>{german.sections.map(([heading,body])=><div key={heading}><h2>{heading}</h2><p>{body}</p></div>)}{title === "COOKIES" && <StorageSettings/>}</> : children}</section><nav className="legal-nav">{["terms","privacy","cookies","shipping","imprint"].map((path,i)=><a key={path} href={sitePath(`/${path}/`)}>{ui[lang].footer[i]}</a>)}</nav></main>;
}
