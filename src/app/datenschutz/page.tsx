import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProsePage } from "@/components/prose-page";
import { betreiberAusEnv } from "@/lib/betreiber";

export const metadata: Metadata = { title: "Datenschutz" };

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-[19px] font-semibold">{titel}</h2>
      {children}
    </section>
  );
}

export default function DatenschutzPage() {
  const b = betreiberAusEnv();

  return (
    <ProsePage title="Datenschutzerklärung">
      <Abschnitt titel="1. Verantwortlicher">
        <p>
          {b.name}
          <br />
          {b.strasse}
          <br />
          {b.ort}
          <br />
          E-Mail: {b.email}
        </p>
      </Abschnitt>

      <Abschnitt titel="2. Das Wichtigste in Kürze">
        <p>
          Diese Website verwendet keine Tracking- oder Analyse-Werkzeuge, keine Werbung und
          bindet keine externen Schriften oder Skripte ein. Die Schriftarten werden von dieser
          Website selbst ausgeliefert. Ein Cookie wird nur gesetzt, wenn sich ein Veranstalter
          anmeldet.
        </p>
      </Abschnitt>

      <Abschnitt titel="3. Hosting und Server-Protokolle">
        <p>
          Die Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
          gehostet. Beim Aufruf einer Seite werden technisch notwendige Daten verarbeitet,
          insbesondere IP-Adresse, Zeitpunkt des Abrufs, aufgerufene Adresse und Angaben zum
          verwendeten Browser. Das ist nötig, um die Website sicher und stabil auszuliefern
          (Art. 6 Abs. 1 lit. f DSGVO). Vercel ist nach dem EU-US Data Privacy Framework
          zertifiziert; zusätzlich besteht ein Vertrag zur Auftragsverarbeitung.
        </p>
        <p>
          Das gilt auch, wenn eine Kalender-App das Kalender-Abo (iCal-Link) regelmäßig abruft.
        </p>
      </Abschnitt>

      <Abschnitt titel="4. Datenbank">
        <p>
          Termine, Raumreservierungen und die Zugänge der Veranstalter werden bei Supabase Inc.
          gespeichert, in einem Rechenzentrum in der Europäischen Union. Mit Supabase besteht ein
          Vertrag zur Auftragsverarbeitung.
        </p>
      </Abschnitt>

      <Abschnitt titel="5. Termine und Raumreservierungen">
        <p>
          Die Veranstalter tragen ihre Termine selbst ein. Termine sind mit allen Angaben,
          einschließlich eines eventuell genannten Ansprechpartners, öffentlich sichtbar und im
          Kalender-Abo enthalten. Wer als Ansprechpartner genannt wird, sollte damit
          einverstanden sein; Änderungen oder Löschungen veranlasst der jeweilige Veranstalter
          oder der Verantwortliche (Abschnitt 1).
        </p>
        <p>
          Bei Raumreservierungen sind öffentlich nur Raum, Zeitraum, Veranstalter und Zweck
          sichtbar. Ansprechpartner und Telefonnummer sehen nur der reservierende Veranstalter
          und die Administration. Rechtsgrundlage ist die Organisation des gemeinsamen
          Veranstaltungskalenders und der Raumbelegung (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </Abschnitt>

      <Abschnitt titel="6. Anmeldung und Cookies">
        <p>
          Für die Anmeldung der Veranstalter wird ein Sitzungs-Cookie gesetzt. Es ist technisch
          notwendig, damit die Anmeldung erhalten bleibt (§ 25 Abs. 2 TDDDG), und wird beim
          Abmelden gelöscht. Besucherinnen und Besucher, die sich nicht anmelden, erhalten keine
          Cookies.
        </p>
      </Abschnitt>

      <Abschnitt titel="7. Eure Rechte">
        <p>
          Ihr habt das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
          Verarbeitung eurer Daten, auf Datenübertragbarkeit sowie das Recht, der Verarbeitung
          zu widersprechen. Wendet euch dazu an den Verantwortlichen (Abschnitt 1).
        </p>
        <p>
          Außerdem könnt ihr euch bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel
          beim Landesbeauftragten für den Datenschutz und die Informationsfreiheit
          Rheinland-Pfalz.
        </p>
      </Abschnitt>

      <p className="text-[13px] text-muted">Stand: Oktober 2026</p>
    </ProsePage>
  );
}
