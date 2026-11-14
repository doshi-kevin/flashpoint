// GET /api/decision/[storeId]  ->  { mode, decision, studyVerdict }
import { NextResponse } from "next/server";
import { getDecisionForStore } from "@/lib/decision";

export async function GET(_req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  try {
    const out = await getDecisionForStore(storeId);
    if (!out) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 501 });
  }
}
