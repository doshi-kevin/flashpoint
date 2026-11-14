// Portfolio tile for one store. Props: store, changePct (computed in code), flagged (bool).
import Link from "next/link";
import Badge from "./Badge";
import { copy } from "@/content/copy";
import type { Store } from "@/lib/types";

export default function StoreCard({ store, changePct, flagged }: { store: Store; changePct: number; flagged: boolean }) {
  return (
    <div className={`rounded border p-4 ${flagged ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{store.name}</h2>
        <Badge tone={flagged ? "bad" : "good"}>{flagged ? copy.portfolio.flagged : copy.portfolio.ok}</Badge>
      </div>
      <p className="text-sm text-gray-500">
        {store.chain} · {store.area}
      </p>
      <p className="my-3 text-3xl font-bold">
        {changePct > 0 ? "+" : ""}
        {changePct.toFixed(1)}%
      </p>
      {flagged && (
        <Link href={`/investigate/${store.id}`} className="text-sm font-medium underline">
          {copy.portfolio.open}
        </Link>
      )}
    </div>
  );
}
