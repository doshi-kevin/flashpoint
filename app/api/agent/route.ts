// POST /api/agent  body: { problem, live? }  ->  NDJSON stream, one JSON object per line:
//   {type:"case", ...}   facts + chart data for the matched store (omitted if no store is mentioned)
//   {type:"step", ...}   a trace step, sent as soon as the agent finishes it
//   {type:"result", result, source, storeId}   the final investigation
import { caseFile, runInvestigation, storeFromProblem } from "@/lib/investigate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const problem = String(body.problem ?? "").slice(0, 600);
  const live = body.live === true;
  const storeId = storeFromProblem(problem);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const cf = caseFile(storeId);
        if (cf) send({ type: "case", ...cf });
        const { result, source } = await runInvestigation(storeId, live, problem, (s) => send({ type: "step", ...s }));
        send({ type: "result", result, source, storeId });
      } catch (e) {
        send({ type: "error", message: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}
