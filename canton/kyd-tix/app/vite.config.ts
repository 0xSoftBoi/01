import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The daml2js-generated packages (and @daml/*) are CommonJS and live behind a
// file: link, so they must be pre-bundled (optimizeDeps) and run through the
// CommonJS transform during the production build.
//
// The JSON API (started by ../integration/run-local.sh) listens on :7575;
// proxying /v1 avoids CORS in development.
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
    },
  },
});
