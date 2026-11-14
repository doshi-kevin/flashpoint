// GET /api/sensitivity?store=14[&upTo=40]  ->  economic + decision sensitivity report for a store.
// `upTo` replays the first N saved Flashpoint answers (mock mode) so a screen can step through the live analysis.
import { NextResponse } from "next/server";
import { getSensitivityReport } from "@/lib/sensitivity-data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const store = url.searchParams.get("store") ?? "14";
  const upToRaw = url.searchParams.get("upTo");
  const upTo = upToRaw === null ? undefined : Number(upToRaw);
  if (upTo !== undefined && (!Number.isInteger(upTo) || upTo < 0)) {
    return NextResponse.json({ error: "upTo must be a non-negative integer" }, { status: 400 });
  }
  const report = await getSensitivityReport(store, upTo);
  if (!report) return NextResponse.json({ error: `unknown store ${store}` }, { status: 404 });
  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
