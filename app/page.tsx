// Screen 1: Portfolio. Store 14 is flagged when its computed weekday-lunch change is below -10%.
import StoreCard from "@/components/StoreCard";
import SampleBadge from "@/components/SampleBadge";
import { getStores, getSales } from "@/lib/data";
import { salesChangePct } from "@/lib/metrics";
import { copy } from "@/content/copy";

const FLAG_THRESHOLD_PCT = -10;

export default function Portfolio() {
  const stores = getStores().map((s) => {
    const changePct = salesChangePct(getSales(s.id));
    return { store: s, changePct, flagged: changePct <= FLAG_THRESHOLD_PCT };
  });
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{copy.portfolio.title}</h1>
          <SampleBadge />
        </div>
        <p className="text-gray-600">{copy.portfolio.subtitle}</p>
        <p className="text-sm italic text-gray-500">{copy.tagline}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <StoreCard key={s.store.id} {...s} />
        ))}
      </div>
    </div>
  );
}
