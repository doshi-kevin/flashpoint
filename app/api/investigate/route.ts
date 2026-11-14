// POST /api/investigate  body: { storeId, live? }  ->  { result, source }. live:false skips Claude and replays the saved investigation (instant).
import { NextResponse } from "next/server";
import { runInvestigation } from "@/lib/investigate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(await runInvestigation(String(body.storeId ?? "14"), body.live !== false));
}
