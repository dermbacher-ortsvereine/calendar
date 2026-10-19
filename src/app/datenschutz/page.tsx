import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <ProsePage title="Datenschutzerklärung">
      <p className="text-muted">
        [Platzhalter – Verantwortlicher, Hosting (Vercel, Supabase), notwendige Cookies für
        den Veranstalter-Login, Rechte der Betroffenen.]
      </p>
      <p className="text-muted">
        Diese Website verwendet keine Tracking- oder Analyse-Werkzeuge und lädt keine externen
        Schriften oder Skripte.
      </p>
    </ProsePage>
  );
}
