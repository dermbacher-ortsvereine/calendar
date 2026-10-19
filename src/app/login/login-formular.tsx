"use client";

import { useActionState } from "react";
import { anmelden, type LoginZustand } from "@/app/login/actions";
import { feldKlasse, fehlerBox, labelKlasse, primaerKnopf } from "@/components/formular/stile";

export function LoginFormular({
  veranstalter,
  weiter,
}: {
  veranstalter: { id: string; name: string }[];
  weiter: string;
}) {
  const [zustand, aktion, laeuft] = useActionState<LoginZustand, FormData>(anmelden, {});

  return (
    <form action={aktion} className="flex flex-col gap-4">
      <input type="hidden" name="weiter" value={weiter} />
      {zustand.fehler && (
        <p role="alert" className={fehlerBox}>
          {zustand.fehler}
        </p>
      )}
      <label className={labelKlasse}>
        Veranstalter
        <select
          name="kennung"
          defaultValue={zustand.kennung ?? ""}
          key={zustand.kennung}
          required
          className={`${feldKlasse} min-h-12`}
        >
          <option value="" disabled>
            Bitte auswählen …
          </option>
          {veranstalter.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
          <option value="admin">Administration</option>
        </select>
      </label>
      <label className={labelKlasse}>
        Passwort
        <input
          type="password"
          name="passwort"
          autoComplete="current-password"
          required
          className={`${feldKlasse} min-h-12`}
        />
      </label>
      <button type="submit" disabled={laeuft} className={`${primaerKnopf} min-h-[50px]`}>
        {laeuft ? "Anmelden …" : "Anmelden"}
      </button>
    </form>
  );
}
