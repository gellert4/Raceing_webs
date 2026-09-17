"use client";
import { useLanguage, LanguageSwitcher } from "@/components/language";
import { sitePath } from "@/lib/paths";
const content = {
  EN: ["CHECK YOUR EMAIL", "Your subscription is completed through the confirmation link from Brevo. This page does not verify your subscription status. If you have not clicked that link yet, check your inbox and spam folder.", "BACK TO FLOWSTATE"],
  HU: ["ELLENŐRIZD AZ EMAILJEIDET", "A feliratkozást a Brevo megerősítő emailjében található linkkel fejezheted be. Ez az oldal nem ellenőrzi a feliratkozásod állapotát. Ha még nem kattintottál a linkre, nézd meg a beérkező és a spam mappát.", "VISSZA A FLOWSTATE-HEZ"],
  DE: ["PRÜFE DEINE E-MAILS", "Deine Anmeldung wird über den Bestätigungslink von Brevo abgeschlossen. Diese Seite prüft deinen Anmeldestatus nicht. Falls du den Link noch nicht angeklickt hast, prüfe dein Postfach und den Spamordner.", "ZURÜCK ZU FLOWSTATE"],
};
export default function EmailStatus() { const { lang } = useLanguage(); const t = content[lang]; return <main className="legal-page"><LanguageSwitcher/><p className="eyebrow">DIVISION ACCESS / 47°N</p><h1>{t[0]}</h1><p>{t[1]}</p><a href={sitePath("/")}>{t[2]}</a></main>; }
