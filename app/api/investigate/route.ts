// POST /api/investigate  body: { storeId }  ->  { result, source }
import { NextResponse } from "next/server";
import { runInvestigation } from "@/lib/investigate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(await runInvestigation(String(body.storeId ?? "14")));
}
