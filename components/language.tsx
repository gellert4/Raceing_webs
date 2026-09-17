"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
export type Language = "EN" | "HU" | "DE";
const Context = createContext<{ lang: Language; setLang: (lang: Language) => void }>({ lang: "EN", setLang: () => {} });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, update] = useState<Language>("EN");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("flowstate-language") || "null");
      if (saved?.expiresAt > Date.now() && ["EN", "HU", "DE"].includes(saved.value)) update(saved.value);
      else localStorage.removeItem("flowstate-language");
    } catch { /* Storage may be unavailable. English stays the default. */ }
    const clear = () => update("EN");
    window.addEventListener("flowstate:clear-storage", clear);
    return () => window.removeEventListener("flowstate:clear-storage", clear);
  }, []);
  useEffect(() => { document.documentElement.lang = lang.toLowerCase(); }, [lang]);
  const setLang = (value: Language) => {
    update(value);
    try { localStorage.setItem("flowstate-language", JSON.stringify({ value, expiresAt: Date.now() + 30 * 86400000 })); } catch {}
  };
  return <Context.Provider value={{ lang, setLang }}>{children}</Context.Provider>;
}
export const useLanguage = () => useContext(Context);
export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return <div className="language-switcher" role="group" aria-label="Language / Nyelv / Sprache">{(["EN", "HU", "DE"] as const).map(value => <button key={value} type="button" lang={value.toLowerCase()} aria-label={{ EN: "English", HU: "Magyar", DE: "Deutsch" }[value]} aria-pressed={value === lang} onClick={() => setLang(value)}>{value}</button>)}</div>;
}
