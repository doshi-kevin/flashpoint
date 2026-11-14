// GET /api/study/[storeId]  ->  { mode, results }
import { NextResponse } from "next/server";
import { getFlashpointAdapter } from "@/lib/flashpoint";

export async function GET(_req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const adapter = getFlashpointAdapter();
  try {
    const results = await adapter.getStudyResults(storeId);
    if (!results) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ mode: adapter.mode, results });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 501 });
  }
}
