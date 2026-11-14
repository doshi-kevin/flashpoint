// Top bar of the app shell: tagline on the left, "Create case" on the right. No props.
import CreateCase from "./CreateCase";
import { copy } from "@/content/copy";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line bg-panel px-6 py-3">
      <p className="hidden truncate text-sm text-muted sm:block">{copy.tagline}</p>
      <CreateCase />
    </header>
  );
}
