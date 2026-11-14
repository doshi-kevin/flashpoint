// Top bar of the app shell: tagline on the left (links on phones), "Create case" on the right. No props.
import Link from "next/link";
import CreateCase from "./CreateCase";
import { copy } from "@/content/copy";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line bg-paper px-4 py-3 sm:px-6">
      <p className="hidden truncate text-sm text-muted md:block">{copy.tagline}</p>
      <nav className="flex items-center gap-4 text-sm font-semibold md:hidden" aria-label="Main">
        <Link href="/">{copy.nav.cases}</Link>
        <Link href="/judges" className="text-muted">
          {copy.nav.survey}
        </Link>
      </nav>
      <CreateCase />
    </header>
  );
}
