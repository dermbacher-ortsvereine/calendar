import Link from "next/link";
import { CalendarIcon } from "@/components/icons";
import { MainNav } from "@/components/main-nav";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-ink no-underline hover:text-ink"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent">
            <CalendarIcon className="size-6 text-white" />
          </span>
          <span>
            <span className="block font-display text-[21px] leading-[1.1] font-bold">
              Dermbacher Ortsvereine
            </span>
            <span className="block text-[13px] text-muted">
              Gemeinsamer Veranstaltungskalender
            </span>
          </span>
        </Link>
        <MainNav />
      </div>
    </header>
  );
}
