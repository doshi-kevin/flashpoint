"use client";
// Top header: brand with amber indicator, chain chip, nav (Cases, Judge feedback), data label, "Create case", manager badge. No props.
import Link from "next/link";
import { usePathname } from "next/navigation";
import CreateCase from "./CreateCase";
import { copy } from "@/content/copy";

const items = [
  { href: "/", label: copy.nav.cases, match: (p: string) => p === "/" || p.startsWith("/case") },
  { href: "/judges", label: copy.nav.survey, match: (p: string) => p.startsWith("/judges") },
];

export default function AppHeader() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line/50 bg-paper/80 shadow-[0_8px_32px_rgba(28,27,24,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-3 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber shadow-[0_0_12px_rgba(245,158,11,0.7)]" aria-hidden />
            <span className="whitespace-nowrap text-sm font-extrabold tracking-tight sm:text-base">{copy.appName}</span>
          </Link>
          <span className="chip hidden px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted sm:inline">
            {copy.workspace}
          </span>
          <nav className="flex items-center gap-3 whitespace-nowrap text-xs sm:gap-4 sm:text-sm" aria-label="Main">
            {items.map((it) => {
              const active = it.match(path);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "font-bold text-ink" : "text-muted hover:text-ink"}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip hidden items-center gap-1.5 px-2.5 py-1 font-mono text-[11px] font-medium uppercase text-ink-2 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full border border-ink-2" aria-hidden />
            {copy.badges.sample}
          </span>
          <CreateCase />
          <div className="hidden items-center gap-2 pl-1 sm:flex">
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold">{copy.persona.name}</p>
              <p className="font-mono text-[11px] text-muted">{copy.persona.role}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-ink to-muted p-[1.5px] shadow-md" aria-hidden>
              <span className="grid h-full w-full place-items-center rounded-full bg-card text-xs font-black">DV</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
