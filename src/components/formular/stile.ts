// Gemeinsame Klassen für Formulare (Design 03: Felder 46–48 px hoch, Radius 10 px).
export const labelKlasse = "flex flex-col gap-1.5 text-sm font-semibold";
export const feldKlasse =
  "min-h-[46px] rounded-control border border-line-input bg-surface px-3 text-base font-normal text-ink";
export const primaerKnopf =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-control bg-accent px-6 text-base font-bold text-white hover:bg-accent-dark disabled:cursor-wait disabled:opacity-70";
export const sekundaerKnopf =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-control border border-line-input bg-surface px-5 text-[15px] font-semibold text-ink no-underline hover:bg-accent-hover hover:text-ink";
export const fehlerBox = "rounded-xl bg-[#FAE6E4] px-4 py-3.5 text-[15px] font-semibold text-[#8C1D17]";
export const erfolgBox = "rounded-xl bg-accent-soft px-4 py-3.5 text-[15px] font-semibold text-accent-dark";
