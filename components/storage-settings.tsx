"use client";
import { useState } from "react";
import { useLanguage } from "@/components/language";
export function StorageSettings() {
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState(false);
  const { lang } = useLanguage();
  const t = { EN: ["Clear saved bag & language", "Local preferences cleared.", "Your browser blocked storage access."], HU: ["Mentett kosár és nyelv törlése", "Helyi beállítások törölve.", "A böngésző blokkolta a tárhely elérését."], DE: ["Warenkorb und Sprache löschen", "Lokale Einstellungen gelöscht.", "Dein Browser hat den Speicherzugriff blockiert."] }[lang];
  return <div className="storage-settings"><button onClick={() => {
    try { localStorage.removeItem("flowstate-cart"); localStorage.removeItem("flowstate-language"); setCleared(true); setError(false); window.dispatchEvent(new Event("flowstate:clear-storage")); } catch { setError(true); }
  }}>{t[0]}</button>{cleared && <p role="status">{t[1]}</p>}{error && <p role="alert">{t[2]}</p>}</div>;
}
