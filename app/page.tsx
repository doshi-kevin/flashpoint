// The single demo page. Picks the store with the biggest computed drop and hands data to <Dashboard>.
import Dashboard from "@/components/Dashboard";
import { getStores, getSales, getEvents } from "@/lib/data";
import { salesChangePct } from "@/lib/metrics";

export default function Home() {
  const worst = getStores()
    .map((s) => ({ store: s, changePct: salesChangePct(getSales(s.id)) }))
    .sort((a, b) => a.changePct - b.changePct)[0];
  return (
    <Dashboard
      storeId={worst.store.id}
      storeName={worst.store.name}
      area={worst.store.area}
      changePct={worst.changePct}
      sales={getSales(worst.store.id)}
      events={getEvents(worst.store.id)}
    />
  );
}
