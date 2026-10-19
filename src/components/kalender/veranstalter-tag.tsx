import type { Veranstalter } from "@/lib/daten";

export function VeranstalterTag({ v }: { v: Veranstalter }) {
  return (
    <span
      className="inline-flex min-h-7 items-center rounded-full px-2.5 text-[13px] font-semibold"
      style={{ background: v.farbe_hg, color: v.farbe }}
    >
      {v.name}
    </span>
  );
}

export function VeranstalterLogo({ v }: { v: Veranstalter }) {
  if (v.logo_url) {
    return (
      // Logos liegen im Supabase-Storage; bewusst ohne Bildoptimierung (kleine Dateien).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={v.logo_url}
        alt=""
        className="size-11 shrink-0 rounded-full border border-line bg-surface object-contain"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      title="Platz für Vereinslogo"
      className="flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed bg-surface text-[13px] font-bold"
      style={{ borderColor: v.farbe, color: v.farbe }}
    >
      {v.kuerzel}
    </span>
  );
}
