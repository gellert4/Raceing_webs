"use client";
import { useState } from "react";
export function StorageSettings() {
  const [cleared, setCleared] = useState(false);
  return <div className="storage-settings"><p>Only the bag and selected language are stored by this storefront. No analytics or advertising scripts are installed.</p><button onClick={() => {
    try { localStorage.removeItem("flowstate-cart"); localStorage.removeItem("flowstate-language"); } catch {}
    window.dispatchEvent(new Event("flowstate:clear-storage")); setCleared(true);
  }}>Clear saved bag & language / Mentett adatok törlése</button>{cleared && <p role="status">Local preferences cleared. Helyi beállítások törölve.</p>}</div>;
}
