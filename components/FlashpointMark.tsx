// "Asked via Flashpoint" provenance mark for real-people evidence. Props: label (optional), detail (optional, e.g. "n = 120").
import { copy } from "@/content/copy";

export default function FlashpointMark({ label, detail }: { label?: string; detail?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-card py-1 pl-1 pr-2.5 text-xs font-semibold text-ink">
      <span className="grid h-5 w-5 place-items-center rounded bg-lime" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M7 1L2.5 7H6l-1 4 4.5-6H6l1-4z" fill="#1c1b18" />
        </svg>
      </span>
      {label ?? copy.flashpoint.mark}
      {detail && <span className="font-mono font-normal text-muted">· {detail}</span>}
    </span>
  );
}
