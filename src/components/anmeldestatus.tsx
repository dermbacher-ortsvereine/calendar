import { abmelden } from "@/app/login/actions";
import { getSitzung } from "@/lib/sitzung";

/** "Angemeldet: …" und "Abmelden" im Header (liest Cookies – in Suspense rendern). */
export async function Anmeldestatus() {
  const sitzung = await getSitzung();
  if (!sitzung) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="px-1 text-sm text-muted-strong">
        Angemeldet: <strong>{sitzung.anzeigename}</strong>
      </span>
      <form action={abmelden}>
        <button
          type="submit"
          className="min-h-11 cursor-pointer rounded-control border border-line-input bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-accent-hover"
        >
          Abmelden
        </button>
      </form>
    </div>
  );
}
