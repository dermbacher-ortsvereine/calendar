import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <ProsePage title="Impressum">
      <p className="text-muted">
        [Platzhalter – Angaben gemäß § 5 DDG: Name und Anschrift des Verantwortlichen, Kontakt.]
      </p>
    </ProsePage>
  );
}
