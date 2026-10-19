import type { ReactNode } from "react";

export function ProsePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-7 sm:px-6">
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 text-[15px] leading-relaxed sm:p-8">
        <h1 className="font-display text-[28px] font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}
