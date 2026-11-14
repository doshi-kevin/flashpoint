// Top navigation between the 5 screens. Uses the demo store (14) for store-specific routes. No props.
import Link from "next/link";
import { copy } from "@/content/copy";

const DEMO_STORE = "14";

export default function Nav() {
  const links = [
    { href: "/", label: copy.nav.portfolio },
    { href: `/investigate/${DEMO_STORE}`, label: copy.nav.investigate },
    { href: `/study/${DEMO_STORE}`, label: copy.nav.study },
    { href: `/decision/${DEMO_STORE}`, label: copy.nav.decision },
    { href: "/judges", label: copy.nav.judges },
  ];
  return (
    <header className="border-b border-gray-200">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 p-4">
        <span className="font-bold">{copy.appName}</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
