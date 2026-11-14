"use client";
// Left navigation (app shell). No props. Items: Cases, Live survey. Hidden on phones (TopBar shows the links there).
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
    <aside className="hidden w-56 shrink-0 border-r border-line bg-soft md:block">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
        <svg width="28" height="28" viewBox="0 0 22 22" aria-hidden="true">
          <rect width="22" height="22" rx="5" fill="#1c1b18" />
          <path d="M3 12h4l2-5 3 9 2-4h5" fill="none" stroke="#d9f06a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="leading-tight">
          <p className="text-sm font-extrabold">{copy.appName}</p>
          <p className="font-mono text-xs text-muted">{copy.workspace}</p>
        </div>
      </div>
      <nav className="p-2" aria-label="Main">
        {items.map((it) => {
          const active = it.match(path);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm ${
                active ? "bg-ink font-semibold text-paper" : "text-ink-2 hover:bg-line"
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
