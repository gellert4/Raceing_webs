import { sitePath } from "@/lib/paths";
import { LanguageProvider } from "@/components/language";
import type { Metadata } from "next";
import "./globals.css";
import "./manifesto-v2.css";
import "./refinements.css";
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "FLOWSTATE RACING — 47°N European Division",
  description: "Limited European motorcycle streetwear designed in Hungary. DROP 001: Enter the Flowstate.",
  icons: {
    icon: sitePath("/favicon.svg"),
    shortcut: sitePath("/favicon.svg"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
