// Slim top bar: app name, tagline, and a link to the closing Judges page. No props.
import Link from "next/link";
import { copy } from "@/content/copy";

export default function Nav() {
  return (
    <header className="border-b border-gray-200">
      <nav className="mx-auto flex max-w-3xl items-center justify-between gap-4 p-4">
        <Link href="/" className="font-bold">
          {copy.appName}
        </Link>
        <span className="hidden text-sm italic text-gray-500 sm:inline">{copy.tagline}</span>
        <Link href="/judges" className="text-sm text-gray-600 hover:underline">
          {copy.nav.judges}
        </Link>
      </nav>
    </header>
  );
}
