"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "@/components/icons";

const linkBase =
  "inline-flex min-h-11 items-center gap-2 rounded-control px-4 text-[15px] font-semibold no-underline";

export function MainNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/termin/") : pathname.startsWith(href);

  return (
    <nav aria-label="Hauptnavigation" className="flex flex-wrap items-center gap-2">
      {[
        { href: "/", label: "Kalender" },
        { href: "/raeume", label: "Räume" },
      ].map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={`${linkBase} ${
            isActive(href)
              ? "bg-accent-soft text-accent-ink hover:text-accent-ink"
              : "text-ink hover:bg-accent-hover hover:text-ink"
          }`}
        >
          {label}
        </Link>
      ))}
      <Link
        href="/verwaltung"
        aria-current={isActive("/verwaltung") ? "page" : undefined}
        className={`${linkBase} bg-accent text-white hover:bg-accent-dark hover:text-white`}
      >
        <PlusIcon className="size-[18px]" />
        Termin eintragen
      </Link>
    </nav>
  );
}
