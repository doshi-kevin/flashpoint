// Builds the static GitHub Pages copy into ./out (no server, so the live agents show the saved Replay).
// Usage: node scripts/build-pages.cjs [repoName]   (default: flashpoint, served at /<repoName>)
// Server-only routes cannot be statically exported (route handlers, per-store case pages), so they are moved
// aside during the build and ALWAYS restored afterwards.
const fs = require("fs");
const { spawnSync } = require("child_process");

const basePath = "/" + (process.argv[2] ?? "flashpoint").replace(/^\/+/, "");
const serverOnly = [
  ["app/api", ".off-api"],
  ["app/case/[id]", ".off-case-id"],
];
const moved = [];
try {
  for (const [from, to] of serverOnly) {
    if (fs.existsSync(to)) throw new Error(`${to} already exists; restore ${from} first`);
    fs.renameSync(from, to);
    moved.push([from, to]);
  }
  const r = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, STATIC_EXPORT: "1", BASE_PATH: basePath },
  });
  if (r.status !== 0) throw new Error("next build failed");
  fs.writeFileSync("out/.nojekyll", "");
  console.log("static site written to ./out");
} finally {
  for (const [from, to] of moved.reverse()) fs.renameSync(to, from);
}
