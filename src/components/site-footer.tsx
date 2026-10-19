import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-[1240px] flex-wrap justify-between gap-3 px-4 pt-2 pb-8 text-[13px] text-muted sm:px-6">
      <span>dermbacher-ortsvereine.de · Gepflegt von den Dermbacher Veranstaltern</span>
      <span className="flex gap-4">
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutz</Link>
      </span>
    </footer>
  );
}
