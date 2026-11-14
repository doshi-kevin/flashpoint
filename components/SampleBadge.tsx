// "Sample data" / "Replay" lozenge shown on any mock or replayed view. Props: kind ("sample" | "replay").
import Badge from "./Badge";
import { copy } from "@/content/copy";

export default function SampleBadge({ kind = "sample" }: { kind?: "sample" | "replay" }) {
  return <Badge tone="sample">{kind === "replay" ? copy.badges.replay : copy.badges.sample}</Badge>;
}
