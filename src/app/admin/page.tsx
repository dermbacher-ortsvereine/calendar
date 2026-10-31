import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { fehlerBox } from "@/components/formular/stile";
import { getSitzung } from "@/lib/sitzung";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import {
  EigenesPasswort,
  LogoVerwalten,
  PasswortZuruecksetzen,
  RaumBearbeiten,
  RaumLoeschen,
  RaumNeu,
  VeranstalterBearbeiten,
  VeranstalterNeu,
} from "@/app/admin/formulare";

export const metadata: Metadata = { title: "Administration" };

const karte = "flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:p-6";
const unterTitel = "text-[15px] font-bold";

async function vorhandeneZugaenge(): Promise<Set<string> | null> {
  try {
    const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
    if (error) return null;
    return new Set(data.users.map((u) => u.email?.toLowerCase() ?? ""));
  } catch {
    return null; // Service-Role-Schlüssel fehlt
  }
}

async function AdminInhalt() {
  const sitzung = await getSitzung();
  if (!sitzung) redirect("/login?weiter=/admin");
  if (!sitzung.istAdmin) {
    return <p role="alert" className={fehlerBox}>Diese Seite ist nur für die Administration.</p>;
  }

  const supabase = await createSessionClient();
  const [{ data: veranstalter }, { data: raeume }, zugaenge] = await Promise.all([
    supabase.from("veranstalter").select("*").order("sortierung").order("name"),
    supabase.from("raeume").select("*").order("sortierung").order("name"),
    vorhandeneZugaenge(),
  ]);
  const naechsteSortierung = Math.max(0, ...(raeume ?? []).map((r) => r.sortierung)) + 10;

  return (
    <div className="flex flex-col gap-6">
      {!zugaenge && (
        <p role="alert" className={fehlerBox}>
          Der Server-Schlüssel <code>SUPABASE_SERVICE_ROLE_KEY</code> fehlt oder ist ungültig. Passwörter setzen und
          neue Zugänge anlegen funktioniert erst, wenn er in Vercel (bzw. lokal in <code>.env.local</code>) eingetragen ist.
        </p>
      )}

      <section aria-labelledby="veranstalter-titel" className="flex flex-col gap-3">
        <h2 id="veranstalter-titel" className="font-display text-[21px] font-bold">Veranstalter</h2>
        <p className="text-[15px] text-muted-strong">Zum Bearbeiten einen Veranstalter aufklappen.</p>
        <ul className="flex flex-col gap-3">
          {(veranstalter ?? []).map((v) => (
            <li key={v.id}>
              <details className="group rounded-card border border-line bg-surface">
                <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex min-h-7 items-center rounded-full px-2.5 text-[13px] font-semibold" style={{ background: v.farbe_hg, color: v.farbe }}>
                    {v.name}
                  </span>
                  <span className="text-[13px] text-muted">
                    {v.kuerzel} · Reihenfolge {v.sortierung}
                    {!v.aktiv && " · inaktiv"}
                    {v.gemeinsam
                      ? " · gemeinsam, ohne eigenen Zugang"
                      : zugaenge && !zugaenge.has(v.login_email.toLowerCase()) && " · noch kein Zugang"}
                  </span>
                  <span aria-hidden="true" className="ml-auto text-muted transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="flex flex-col gap-6 border-t border-line px-5 py-5">
                  <VeranstalterBearbeiten
                    v={{ id: v.id, name: v.name, kuerzel: v.kuerzel, farbe: v.farbe, farbe_hg: v.farbe_hg, sortierung: v.sortierung, aktiv: v.aktiv }}
                  />
                  <div className="flex flex-col gap-3 border-t border-line-soft pt-5">
                    <h3 className={unterTitel}>Logo</h3>
                    <LogoVerwalten id={v.id} logoUrl={v.logo_url} kuerzel={v.kuerzel} farbe={v.farbe} />
                  </div>
                  <div className="flex flex-col gap-3 border-t border-line-soft pt-5">
                    <h3 className={unterTitel}>Zugang</h3>
                    {v.gemeinsam ? (
                      <p className="text-sm text-muted">
                        Gemeinsamer Veranstalter: kein eigener Zugang. Alle Veranstalter können in seinem Namen Termine und
                        Reservierungen eintragen, ändern und löschen.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted">
                          Interne Login-Adresse: <code>{v.login_email}</code> (wird beim Login automatisch verwendet)
                        </p>
                        <PasswortZuruecksetzen id={v.id} name={v.name} />
                      </>
                    )}
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="raeume-titel" className="flex flex-col gap-3">
        <h2 id="raeume-titel" className="font-display text-[21px] font-bold">Räume</h2>
        <p className="text-[15px] text-muted-strong">Räume, die unter „Räume“ belegt und reserviert werden können.</p>
        <ul className="flex flex-col gap-3">
          {(raeume ?? []).map((r) => (
            <li key={r.id}>
              <details className="group rounded-card border border-line bg-surface">
                <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="text-[15px] font-semibold">{r.name}</span>
                  <span className="text-[13px] text-muted">
                    {r.id} · Reihenfolge {r.sortierung}
                  </span>
                  <span aria-hidden="true" className="ml-auto text-muted transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="flex flex-col gap-6 border-t border-line px-5 py-5">
                  <RaumBearbeiten r={{ id: r.id, name: r.name, sortierung: r.sortierung }} />
                  {(raeume ?? []).length > 1 && (
                    <div className="flex flex-col gap-3 border-t border-line-soft pt-5">
                      <h3 className={unterTitel}>Löschen</h3>
                      <RaumLoeschen id={r.id} name={r.name} />
                    </div>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
        <div className={karte}>
          <h3 className="font-display text-[19px] font-bold">Neuer Raum</h3>
          <RaumNeu sortierung={naechsteSortierung} />
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section aria-labelledby="neu-titel" className={karte}>
          <h2 id="neu-titel" className="font-display text-[21px] font-bold">Neuer Veranstalter</h2>
          <VeranstalterNeu />
        </section>
        <section aria-labelledby="eigen-titel" className={karte}>
          <h2 id="eigen-titel" className="font-display text-[21px] font-bold">Eigenes Passwort</h2>
          <EigenesPasswort />
        </section>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto flex max-w-[1000px] flex-col gap-5 px-4 py-7 sm:px-6">
      <h1 className="font-display text-[26px] font-bold sm:text-[30px]">Administration</h1>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-card bg-surface" />}>
        <AdminInhalt />
      </Suspense>
    </main>
  );
}
