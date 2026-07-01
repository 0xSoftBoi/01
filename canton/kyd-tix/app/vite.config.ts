import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The daml2js-generated packages (and @daml/*) are CommonJS and live behind a
// file: link, so they must be pre-bundled (optimizeDeps) and run through the
// CommonJS transform during the production build.
//
// The JSON API (started by ../integration/run-local.sh) listens on :7575;
// proxying /v1 avoids CORS in development. The auth/catalog/payments server
// (../server, run-local.sh's step 3) listens on :4001 — everything the
// browser is allowed to reach without an operator-scoped ledger token.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@daml/ledger", "@daml/types", "@kyd/kyd-tix-0.1.0"],
  },
  build: {
    commonjsOptions: {
      include: [/daml\.js/, /node_modules/],
    },
  },
  server: {
    proxy: {
      "/v1": "http://localhost:7575",
      "/auth": "http://localhost:4001",
      "/catalog": "http://localhost:4001",
      "/payments": "http://localhost:4001",
      "/.well-known": "http://localhost:4001",
    },
  },
});
