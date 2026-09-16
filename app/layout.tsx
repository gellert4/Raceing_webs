import { sitePath } from "@/lib/paths";
import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";
import "./manifesto-v2.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "FLOWSTATE RACING — 47°N European Division",
  description: "FLOWSTATE RACING is a Central-European streetwear label born in Hungary. DROP 001: Enter the Flowstate.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
