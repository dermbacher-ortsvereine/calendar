import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

// next/font lädt die Schriften beim Build und liefert sie selbst aus –
// im Browser gehen keine Anfragen an Google (DSGVO).
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Dermbacher Ortsvereine – Veranstaltungskalender",
    template: "%s · Dermbacher Ortsvereine",
  },
  description:
    "Gemeinsamer Veranstaltungskalender der Dermbacher Ortsvereine und Veranstalter.",
};

export const viewport: Viewport = {
  themeColor: "#24573A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${figtree.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
