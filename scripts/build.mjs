import { mkdir, cp } from "node:fs/promises";
import { build } from "esbuild";
await mkdir("dist/server", { recursive: true });
await mkdir("dist/client", { recursive: true });
await cp("public", "dist/client", { recursive: true });
await cp("src/engine.js", "dist/client/engine.js");
await build({
  entryPoints: ["src/worker.js"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
});
