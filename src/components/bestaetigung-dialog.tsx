"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export const rotKnopf =
  "inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-control bg-[#B3261E] px-5 text-base font-bold text-white hover:bg-[#8C1D17] disabled:cursor-wait disabled:opacity-70";
const abbrechenKnopf =
  "inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-control border border-line-input bg-surface px-5 text-[15px] font-semibold text-ink hover:bg-accent-hover";

/**
 * Rückfrage als Modal (natives `<dialog>`: Fokusfalle, Esc schließt, liegt über allem).
 * Am Handy als Bottom-Sheet, ab `sm` zentriert; Knöpfe immer groß und untereinander.
 * `children`: die Bestätigungs-Knöpfe (type="submit"); das Formular drumherum kommt als `action`.
 */
export function BestaetigungDialog({
  offen,
  onSchliessen,
  titel,
  text,
  action,
  felder,
  children,
}: {
  offen: boolean;
  onSchliessen: () => void;
  titel: string;
  text?: ReactNode;
  action: (formData: FormData) => void | Promise<void>;
  /** versteckte Felder für die Server-Action */
  felder: Record<string, string | undefined>;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titelId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (offen && !dialog.open) dialog.showModal();
    if (!offen && dialog.open) dialog.close();
  }, [offen]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titelId}
      aria-describedby={text ? textId : undefined}
      onClose={onSchliessen}
      // Klick auf den abgedunkelten Hintergrund schließt
      onClick={(e) => {
        if (e.target === e.currentTarget) onSchliessen();
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-card bg-surface p-0 text-ink shadow-xl backdrop:bg-[#17201b]/45 sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-md sm:rounded-card"
    >
      {offen && (
        <form action={action} className="flex flex-col gap-5 px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          {Object.entries(felder).map(([name, wert]) =>
            wert === undefined ? null : <input key={name} type="hidden" name={name} value={wert} />,
          )}
          <div className="flex flex-col gap-2">
            <h2 id={titelId} className="font-display text-xl leading-tight font-bold">
              {titel}
            </h2>
            {text && (
              <p id={textId} className="text-[15px] leading-snug text-muted">
                {text}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            {children}
            <button type="button" autoFocus onClick={onSchliessen} className={abbrechenKnopf}>
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
