# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# kyd-tix server — auth issuer + catalog + PSP webhook tier.
#
# Runtime approach (deliberate): the server runs via tsx, not compiled JS.
# tsconfig.json *does* emit (outDir: dist, no noEmit), and `npx tsc` compiles
# cleanly — but the emitted ESM does not run under plain `node`: the daml
# codegen bindings (daml.js/*, wired in as file: dependencies) are imported
# with extensionless directory subpaths (e.g. @kyd/kyd-tix-0.1.0/lib/Kyd/Event),
# which node's ESM resolver rejects (ERR_UNSUPPORTED_DIR_IMPORT). That is why
# tsconfig uses moduleResolution "Bundler". tsx resolves these fine, so we ship
# source + tsx. Tradeoff: devDependencies (tsx, typescript, vitest, ...) stay
# in the image, making it larger than a compiled image would be. Revisit if the
# codegen output ever becomes node-ESM-clean.
#
# Native modules: better-sqlite3 is being added (SQLite state at DB_PATH). It
# ships prebuilds for linux-x64 glibc, so `npm ci` on a glibc image just works;
# the deps stage uses the FULL node:22-bookworm image (python3/make/g++
# included) so a compile-from-source fallback also works. Do NOT switch to
# alpine/musl — the prebuilds would not apply and musl builds are unsupported
# here.
# ---------------------------------------------------------------------------

# ----- Stage 1: dependencies (glibc, full toolchain for native modules) -----
FROM node:22-bookworm AS deps
WORKDIR /app

# daml.js/ holds the generated ledger bindings. It is gitignored but present in
# the working tree, and package.json depends on it via
# "file:daml.js/kyd-tix-0.1.0" (which itself links sibling packages in
# daml.js/), so it must be COPYed explicitly BEFORE npm ci or install fails.
COPY package.json package-lock.json ./
COPY daml.js ./daml.js

# Install ALL deps (no --omit=dev): tsx is a devDependency but is the runtime
# loader — see header comment.
RUN npm ci

# ----- Stage 2: runtime (slim, non-root) -------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4001 \
    DB_PATH=/data/kyd.db \
    DEMO_PARTIES_PATH=/app/demo-parties.json

# node_modules contains symlinks into daml.js/ (npm file: deps), so daml.js
# must sit at the same relative path in this stage too.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/daml.js ./daml.js
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

# /data holds the SQLite DB (DB_PATH) — writable by the runtime user and
# volume-friendly. Everything else stays root-owned and read-only.
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

# demo-parties.json is NOT baked in (it lives outside this build context and is
# environment-specific) — mount it at $DEMO_PARTIES_PATH, see deploy/.

USER node
EXPOSE 4001

# slim has no curl; probe /health with node's built-in fetch.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "src/index.ts"]
