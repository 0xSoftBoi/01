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
      // Without this, Rollup's CJS transform left a bare `require("lodash.isequal")`
      // in the production bundle (from @mojotech/json-type-validation, a
      // dependency of the generated daml.js decoders, resolved to its UMD
      // build because the daml.js codegen output requires it via CJS) —
      // `require` doesn't exist in a browser, so the app crashed on load
      // with a blank screen. Found by actually opening the built app in a
      // real browser, not just `tsc --noEmit && vite build` succeeding.
      transformMixedEsModules: true,
    },
  },
  server: {
    proxy: {
      "/v1": "http://localhost:7575",
      "/auth": "http://localhost:4001",
      "/catalog": "http://localhost:4001",
      "/payments": "http://localhost:4001",
      "/notifications": "http://localhost:4001",
      "/analytics": "http://localhost:4001",
      "/.well-known": "http://localhost:4001",
    },
  },
  // `vite preview` (serving the production dist/ build) reads a separate
  // proxy config from `server`'s — same targets, so `npm run build && npm
  // run preview` works against a running stack the same way `npm run dev`
  // does.
  preview: {
    proxy: {
      "/v1": "http://localhost:7575",
      "/auth": "http://localhost:4001",
      "/catalog": "http://localhost:4001",
      "/payments": "http://localhost:4001",
      "/notifications": "http://localhost:4001",
      "/analytics": "http://localhost:4001",
      "/.well-known": "http://localhost:4001",
    },
  },
});
