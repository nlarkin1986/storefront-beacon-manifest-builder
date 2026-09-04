# Agent brief — implement Manifest Builder in another tool

You are implementing a **URL → beacon-manifest** builder from this repo. You do not have Grok Bot. You have HTTP (curl), optional static JS GET, and this spec.

## Job

1. Accept a storefront URL.
2. Probe **without driving the UI**.
3. Bind live APIs to Gladly-canonical tools in discovery JSON.
4. Emit a Chat SDK–valid `{domain}.beacon-manifest.json`.
5. Write `{domain}.report.md` with platform, MCP status, walls, gaps, `demo_ready_quality`, `needs_custom`, `wall_class`.

## Required reading (in order)

1. `spec/path-b-storefront-probe.md`
2. `spec/beacon-config-reference.md`
3. `schemas/discovery-emit-template.json`
4. `schemas/beacon-manifest.schema.json`
5. One example from each of `examples/path-a`, `examples/path-b`, `examples/thin`

Optional depth: `spec/api-first-playbook.md`, `spec/api-calls.md`, `spec/path-b-hardening.md`, `spec/retailer-endpoint-discovery.md`.

## Success criteria

- Valid JSON matching `schemas/beacon-manifest.schema.json`
- `common[].name` only from the registry in the config reference
- Config keys ⊆ ManifestConfig for that name
- `custom` empty unless `bundleUrl` is a real file you were given
- No `showCheckout` unless checkout config exists
- Discovery stamps `demo_ready_quality` + `needs_custom` + `wall_class`
- Report states auth gaps instead of inventing OMS routes
- Widget tool names are Chat SDK (`*.searchProducts`), not `search_catalog`

## Never

- Playwright / click-tour HAR as the default path
- Invented commons (`gap-commerce`, fake Algolia from string noise)
- BV `passkey`, Yotpo `siteId`, Shopify `storeDomain` in config
- Claiming BV-as-catalog has price/inventory
- High confidence for Wayback-only policies
- Blocking the run on missing MCP (Path B batch was 0/10 MCP)

## Handoff after emit

If `needs_custom` ≠ `none`, output a one-liner pack hole (platform + host + header recipe). Do not write the custom bundle in this job unless the user explicitly expands scope.
