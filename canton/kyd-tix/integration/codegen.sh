#!/usr/bin/env bash
# Generate TypeScript bindings (daml2js) for the KYD web app from the built DAR.
# Output lands in integration/client/daml.js as the @kyd npm scope, e.g.
# `@kyd/kyd-tix-0.1.0`, which the client imports for fully-typed templates,
# choices and contract IDs.
set -euo pipefail
cd "$(dirname "$0")/.."

daml build --all
daml codegen js .daml/dist/kyd-tix-0.1.0.dar -o integration/client/daml.js -s kyd

echo "Generated TypeScript bindings into integration/client/daml.js"
