# Optional web research with Parallel Search MCP

Use [Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)
from Codex to find current protocol documentation and fetch primary sources
while reviewing the Canton/DAML audit surfaces in this repo. The anonymous
endpoint provides free web search in Fast mode and page fetching without an
account or API key, subject to service limits.

This is an opt-in addition to the [ECC MCP baseline](config.toml). Keep the
existing Exa, Context7, and other server entries. It does not change the app or
ledger configuration.

## Setup

With [Codex CLI installed](https://developers.openai.com/codex/cli/), add this
named server table to your **user** `~/.codex/config.toml`. Merge it into your
existing file rather than replacing the file. If you already have a
`parallel-search` entry, inspect it before editing to avoid a duplicate table
or overwriting your settings.

```toml
[mcp_servers.parallel-search]
url = "https://search.parallel.ai/mcp"
http_headers = { "User-Agent" = "01-codex-research/1.0 (https://github.com/0xSoftBoi/01)" }
```

Codex supports Streamable HTTP MCP servers and static `http_headers`; see its
[MCP configuration guide](https://developers.openai.com/codex/mcp/).
No bearer token or login is needed for this endpoint.

Inspect the saved entry:

```bash
codex mcp get parallel-search --json
```

Start a new Codex session in the repository and run `/mcp`. Confirm that
`parallel-search` connects and exposes `web_search` and `web_fetch`. The CLI
`get` command checks saved configuration; `/mcp` checks the live connection.

## Research an audit question

The [docs researcher](agents/docs-researcher.toml) calls for primary-source
verification. For example, ask Codex:

```text
Read canton/kyd-tix/daml.yaml and canton/kyd-tix/DESIGN.md. Use Parallel's
web_search to find primary Daml documentation about explicit disclosure and
divulgence. Prefer docs.daml.com, docs.digitalasset.com, and docs.canton.network.
Separate guidance for the SDK version pinned in daml.yaml from newer releases.
Use web_fetch if an exact passage or missing context needs checking. Return a
table of claim, source URL, documented version, and relevance to this repo.
Mark anything you cannot verify; do not change code.
```

Keep queries limited to public protocol details rather than private audit
evidence. Search results help locate references; check their versions and exact
wording before using them to support an audit finding. This complements the
[executable audit scenarios](../canton/kyd-tix/AUDIT.md), which remain the proof
of behavior in this repo.

If the tools are unavailable, check `/mcp` for connection errors. If a call
reports a service limit, retry after the indicated interval or use your existing
research tools; do not treat an error as evidence.

To disable only this server, add `enabled = false` inside its existing
`[mcp_servers.parallel-search]` table. To remove its user-config entry, run:

```bash
codex mcp remove parallel-search
```

Restart Codex after changing the configuration.
