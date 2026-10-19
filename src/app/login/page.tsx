import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LockIcon } from "@/components/icons";
import { getVeranstalter } from "@/lib/daten";
import { sichererPfad } from "@/lib/pfad";
import { getSitzung } from "@/lib/sitzung";
import { LoginFormular } from "@/app/login/login-formular";

export const metadata: Metadata = { title: "Anmelden" };

async function LoginInhalt({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { weiter } = await searchParams;
  const ziel = sichererPfad(Array.isArray(weiter) ? weiter[0] : weiter);
  if (await getSitzung()) redirect(ziel);

  const veranstalter = await getVeranstalter();
  return <LoginFormular veranstalter={veranstalter.map(({ id, name }) => ({ id, name }))} weiter={ziel} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="px-4 py-7 sm:px-6">
      <div className="mx-auto my-6 flex max-w-[440px] flex-col gap-4 rounded-[18px] border border-line bg-surface p-6 sm:my-10 sm:p-8">
        <div className="flex size-[52px] items-center justify-center rounded-[14px] bg-accent-soft">
          <LockIcon className="size-[26px] text-accent" />
        </div>
        <h1 className="font-display text-[28px] font-bold">Termine pflegen</h1>
        <p className="text-[15px] leading-normal text-muted-strong">
          Melde dich mit dem Zugang deines Veranstalters an, um Termine einzutragen oder zu ändern.
        </p>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-control bg-bg" />}>
          <LoginInhalt searchParams={props.searchParams} />
        </Suspense>
        <p className="text-[13px] text-muted">
          Passwort vergessen? Bitte bei [Ansprechpartner Kalender] melden.
        </p>
      </div>
    </main>
  );
}
