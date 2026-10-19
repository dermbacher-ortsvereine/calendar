import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { betreiberAusEnv } from "@/lib/betreiber";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  const b = betreiberAusEnv();

  return (
    <ProsePage title="Impressum">
      <section className="flex flex-col gap-1">
        <h2 className="font-display text-[19px] font-semibold">Angaben gemäß § 5 DDG</h2>
        <p>
          {b.name}
          <br />
          {b.strasse}
          <br />
          {b.ort}
        </p>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="font-display text-[19px] font-semibold">Kontakt</h2>
        <p>
          E-Mail:{" "}
          {b.vollstaendig ? (
            <a href={`mailto:${b.email}`} className="text-accent underline underline-offset-2">
              {b.email}
            </a>
          ) : (
            b.email
          )}
          {b.telefon && (
            <>
              <br />
              Telefon: <a href={`tel:${b.telefon.replace(/[^\d+]/g, "")}`}>{b.telefon}</a>
            </>
          )}
        </p>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="font-display text-[19px] font-semibold">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p>
          {b.name}, Anschrift wie oben
        </p>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="font-display text-[19px] font-semibold">Hinweis zu den Terminen</h2>
        <p>
          Dieser Kalender ist ein gemeinsames Angebot der Dermbacher Ortsvereine und
          Veranstalter. Die Termine und Raumreservierungen tragen die jeweiligen Veranstalter
          selbst und eigenverantwortlich ein. Fragen zu einer Veranstaltung richtet ihr bitte an
          den genannten Veranstalter.
        </p>
      </section>
    </ProsePage>
  );
}
