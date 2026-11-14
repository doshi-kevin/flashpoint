"use client";
// Left navigation (app shell). No props. Items: Cases, Live survey.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { copy } from "@/content/copy";

const items = [
  { href: "/expansion", label: "Open Store 51", match: (p: string) => p.startsWith("/expansion") },
  { href: "/", label: copy.nav.cases, match: (p: string) => p === "/" || p.startsWith("/case") },
  { href: "/judges", label: copy.nav.survey, match: (p: string) => p.startsWith("/judges") },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 border-r border-line bg-panel md:block">
      <div className="flex items-center gap-2 border-b border-line px-4 py-4">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-accent text-sm font-bold text-white">
          EP
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">{copy.appName}</p>
          <p className="text-xs text-muted">{copy.workspace}</p>
        </div>
      </div>
      <nav className="p-2">
        {items.map((it) => {
          const active = it.match(path);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded px-3 py-2 text-sm ${
                active ? "bg-[#e9f2ff] font-semibold text-info" : "text-fg hover:bg-soft"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
