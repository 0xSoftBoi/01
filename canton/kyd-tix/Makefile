# One-command entry points for the whole stack.
.PHONY: build test server-test codegen app demo clean

# Build both Daml packages (CIP-56 interfaces + kyd-tix).
build:
	daml build --all

# Full suite: functional + adversarial + token-standard scenarios.
test: build
	daml test

# Auth/catalog/payments server tests (no ledger required — see server/README.md).
server-test:
	cd server && npm install --no-audit --no-fund && npm test

# Typed TS bindings for the web app (and the integration client example).
codegen: build
	cd app && npm run codegen
	./integration/codegen.sh

# Type-check + production-build the web app.
app: codegen
	cd app && npm install --no-audit --no-fund && npm run build

# Boot the local demo stack (sandbox + seed + JSON API + server + triggers).
# Then: cd app && npm run dev
demo: build
	./integration/run-local.sh

clean:
	rm -rf .daml splice-token-standard/.daml app/dist app/daml.js integration/client/daml.js server/dist log
