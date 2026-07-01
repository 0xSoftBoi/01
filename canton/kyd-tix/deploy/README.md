# kyd-tix — deploy (app-server tier)

Containerizes **only** the Node app server (`../server`): auth issuer, catalog,
PSP webhook, payments. The Canton participant, HTTP JSON API and Daml triggers
are **not** in here — they run outside this compose file.

## Prerequisites

- Docker with the compose plugin.
- A running ledger with the kyd-tix DAR loaded and the demo parties allocated.
  Locally that is `make demo` from the kyd-tix repo root (JSON API on `:7575`);
  in production, a real participant per `../validator/README.md`.
- `../app/public/demo-parties.json` present and current (written by the demo
  setup) — it is mounted read-only into the container; the server exits at
  startup without it.
- `../server/daml.js/` present (gitignored codegen output; run
  `npm run codegen` in `../server` if missing) — the image copies it from the
  working tree.

## Run

```sh
cd deploy
docker compose up --build
```

Server on <http://localhost:4001> (health: `GET /health`).

## How it finds the ledger

`JSON_API_URL` defaults to `http://host.docker.internal:7575`, and the compose
file maps `host.docker.internal` to the host gateway (`extra_hosts:
host-gateway`) so this also works on Linux. That reaches a `make demo` stack
running on the Docker host. Point it elsewhere with:

```sh
JSON_API_URL=http://participant.example:7575 docker compose up --build
```

Other knobs (shell env or a `.env` file next to this compose file):
`PSP_WEBHOOK_SECRET` (unset ⇒ demo secret + loud warning),
`INDEXER_INTERVAL_MS` (default 5000).

## Where the SQLite data lives

`DB_PATH=/data/kyd.db` on the named volume `kyd-data` (i.e.
`deploy_kyd-data` — inspect with `docker volume inspect deploy_kyd-data`).
It survives `docker compose down`; `docker compose down -v` deletes it.

## Production note

This compose file is a demo/dev topology. For production: swap SQLite for
Postgres (managed, backed up), inject `PSP_WEBHOOK_SECRET` and signing keys
from a real secrets manager (not shell env / `.env` files), and run against a
real validator participant. See `../PRODUCTION.md`, section 10.
