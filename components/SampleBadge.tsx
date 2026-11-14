// Data-provenance label shown on any mock, replayed, synthetic or real view.
// Props: kind ("sample" | "replay" | "synthetic" | "real" | "live").
import Badge from "./Badge";
import { copy } from "@/content/copy";

type Kind = "sample" | "replay" | "synthetic" | "real" | "live";

export default function SampleBadge({ kind = "sample" }: { kind?: Kind }) {
  if (kind === "live")
    return (
      <Badge tone="real">
        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
        {copy.badges.live}
      </Badge>
    );
  return (
    <Badge tone={kind}>
      {kind === "replay" && <span aria-hidden="true">↻</span>}
      {copy.badges[kind]}
    </Badge>
  );
}
