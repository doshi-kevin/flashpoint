// GET /api/market-entry  ->  store #51 market-entry report: projections at each research level,
// the recommended area and menu concept, sensitivity of the site choice, research ROI, and Flashpoint study specs.
import { NextResponse } from "next/server";
import { getMarketEntryReport } from "@/lib/market-entry-data";

export function GET() {
  return NextResponse.json(getMarketEntryReport(), { headers: { "Cache-Control": "no-store" } });
}
