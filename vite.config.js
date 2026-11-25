import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";
import { realpathSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import process from "node:process";

// Ship PDF.js character maps with the app so Korean PDFs also work offline.
function pdfCharacterMaps() {
  const directory = join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "cmaps");
  const assetDirectory = "assets/pdfjs/cmaps/";
  const files = () => readdir(directory).then(names => names.filter(name => name.endsWith(".bcmap") || name === "LICENSE"));
  return {
    name: "pdf-character-maps",
    async configureServer(server) {
      const names = new Set(await files());
      server.middlewares.use(`${server.config.base}${assetDirectory}`, async (request, response, next) => {
        const name = request.url?.split("?")[0].replace(/^\/+/, "");
        if (!["GET", "HEAD"].includes(request.method) || !names.has(name)) return next();
        try {
          const data = await readFile(join(directory, name));
          response.setHeader("Content-Type", "application/octet-stream");
          response.setHeader("Content-Length", data.length);
          response.end(request.method === "HEAD" ? undefined : data);
        } catch (error) {
          next(error);
        }
      });
    },
    async generateBundle() {
      for (const name of await files()) {
        this.emitFile({ type: "asset", fileName: `${assetDirectory}${name}`, source: await readFile(join(directory, name)) });
      }
    },
  };
}

const allowedFsRoots = [searchForWorkspaceRoot(process.cwd())];
try {
  const realNodeModules = realpathSync(join(process.cwd(), "node_modules"));
  allowedFsRoots.push(realNodeModules, dirname(realNodeModules));
} catch {
  // node_modules가 아직 없는 초기 환경에서는 기본 워크스페이스 루트만 허용한다.
}
if (process.env.LOCALAPPDATA) {
  allowedFsRoots.push(join(process.env.LOCALAPPDATA, "Bojogae", "LocalInfra"));
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pdfCharacterMaps()],
  server: {
    port: 3301,
    strictPort: true,
    fs: {
      allow: [...new Set(allowedFsRoots)],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
