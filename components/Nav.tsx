// Slim top bar: app name, tagline, and a link to the closing Judges page. No props.
import Link from "next/link";
import { copy } from "@/content/copy";

export default function Nav() {
  return (
    <header className="border-b border-line bg-panel">
      <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
          {copy.appName}
        </Link>
        <span className="hidden font-serif text-sm italic text-muted sm:inline">{copy.tagline}</span>
        <Link href="/judges" className="text-sm text-muted hover:text-fg">
          {copy.nav.judges}
        </Link>
      </nav>
    </header>
  );
}
