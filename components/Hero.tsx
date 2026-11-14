// Top of the page: what this is, in plain English, plus the 3-step "how it works". No props. Text lives in content/copy.ts.
import { copy } from "@/content/copy";

export default function Hero() {
  return (
    <section className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="font-serif text-5xl font-semibold leading-tight">{copy.hero.title}</h1>
        <p className="mt-4 text-lg text-muted">{copy.hero.sub}</p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-3">
        {copy.hero.how.map((s) => (
          <li key={s.n} className="rounded-xl border border-line bg-panel p-5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
              {s.n}
            </span>
            <p className="mt-3 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
