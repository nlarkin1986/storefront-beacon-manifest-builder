# Storefront Beacon Manifest Builder

HTTP-only pipeline: **storefront URL in → Demo Buddy / Chat SDK beacon-manifest JSON out.**

This repo is the implementer pack for an agent or tool *outside* Grok Bot. No click-tour HAR. Probe published contracts (MCP, REST, JSON-LD, static JS). Emit a spec-valid beacon.

## What you implement

Given `https://www.example.com`, produce three artifacts:

| File | Role |
|---|---|
| `{domain}.manifest.json` | Discovery SoT (Gladly-canonical tools + live HTTP bindings + confidence) |
| `{domain}.beacon-manifest.json` | **Loadable Chat SDK contract** (`version`, `generatedAt`, `integrations.common/core/custom`) |
| `{domain}.report.md` | Human triage: platform, walls, gaps, pack holes |

Target latency: Path A (vendor commons) ~20s; Path B (custom BFF) 30–60s for discovery+draft. Custom JS bundles are **out of scope** here — discovery labels them `needs_custom`.

## Start here (for the implementing agent)

1. Read [`AGENTS.md`](AGENTS.md) — job, I/O, never-do.
2. Run the probe in [`spec/path-b-storefront-probe.md`](spec/path-b-storefront-probe.md).
3. Validate `common[].config` against [`spec/beacon-config-reference.md`](spec/beacon-config-reference.md).
4. Stamp discovery fields from [`schemas/discovery-emit-template.json`](schemas/discovery-emit-template.json).
5. Diff your beacon against examples:
   - Path A thick: [`examples/path-a/vuoriclothing.com.beacon-manifest.json`](examples/path-a/vuoriclothing.com.beacon-manifest.json)
   - Path A commons on a walled site: [`examples/path-a/jcrew.com.beacon-manifest.json`](examples/path-a/jcrew.com.beacon-manifest.json)
   - Path B custom BFF: [`examples/path-b/gap.com.beacon-manifest.json`](examples/path-b/gap.com.beacon-manifest.json)
   - Thin HTML: [`examples/thin/nordstrom.com.beacon-manifest.json`](examples/thin/nordstrom.com.beacon-manifest.json)

Full playbook: [`spec/api-first-playbook.md`](spec/api-first-playbook.md). Probe API catalog: [`spec/api-calls.md`](spec/api-calls.md). Original working spec: [`spec/retailer-endpoint-discovery.md`](spec/retailer-endpoint-discovery.md).

## Beacon JSON (must match Chat SDK)

```json
{
  "version": "1.0",
  "generatedAt": "2026-09-04T00:00:00.000Z",
  "integrations": {
    "common": [{ "name": "algolia", "config": {}, "tools": [] }],
    "core": { "tools": [] },
    "custom": []
  }
}
```

- `common[].name` ∈ Chat SDK registry only (`algolia`, `shopify`, `shopify-storefront`, `bazaarvoice`, `constructorio`, `turnto`, `yotpo`, …).
- `config` keys ⊆ that integration’s `*ManifestConfig` (see config reference). **Traps:** no Shopify `storeDomain`; Yotpo is `appKey` not `siteId`; Bazaarvoice is `clientName`/`locale`/`bfdToken` not `passkey`.
- Tools: only `name`, `description`, `inputSchema`, optional `annotations` / `outputSchema`. Extract from chat-sdk `integrations/*/index.ts` when you have the SDK.
- `custom: []` unless a real `bundleUrl` exists. Customer BFFs (Gap `api.gap.com`, Nike `product_feed`, Uniqlo FR v5) are **custom**, never invented commons.
- No `showCheckout` without `core.config.checkout`. Cart mutations are usually `needs_auth` — omit rather than fake.

## Decision tree (after homepage + one JS scan)

```
vendor keys (Algolia / Constructor / Searchspring) → hydrate commons FIRST
else public BFF 200 → bind BFF (label needs_custom: new_bff | fork)
else Bazaarvoice products live → BV-as-catalog (quality: bv_fallback)
else JSON-LD Product + policy HTML → thin_html
else → blocked_waf / QUEUE
```

Quality labels (do not treat all `demo_ready: true` as equal):

- `demo_ready_quality`: `strong` | `commons` | `bv_fallback` | `thin_html`
- `needs_custom`: `none` | `fork` | `new_bff` | `held_bot_wall`
- `wall_class`: `none` | `akamai_a32` | `akamai_bvm` | `datadome` | `ge401001` | `imperva`

## Probe headers

Chrome desktop UA + gzip + Origin/Referer first. Add Sec-CH-UA on Akamai 403. Never lead Path B with Googlebot. Cap 2 UAs × 1 retry. Stamp `egress_fragile` when Sec-CH/sensor required.

## Canonical Gladly tools (discovery layer)

`search_catalog`, `get_product`, `list_collections`, `get_cart`, `update_cart`, `search_policies`, `lookup_order`, `create_return`. Prefer MCP over REST when live. Mark `lookup_order` / `create_return` / cart as `needs_auth` unless credentials exist.

Beacon **widget** names are Chat SDK names (`algolia.searchProducts`, `bazaarvoice.getProductReviews` with `productId=<styleId>`, …) — never Gladly-canonical names in the widget.

## Out of scope (another lane)

Custom integration JS bundles, playbooks, site twins, Chat SDK `local-chat-*.json` wiring. This pack stops at discovery + beacon JSON.

## Examples note

Example beacons include **public search-only** vendor keys found in storefront JS (e.g. Algolia search key). Treat them as fixtures, not secrets to rotate. Do not add unpublished passkeys or OMS credentials.

## Validation

Examples in this repo passed Chat SDK `validManifest()` + `valid*ManifestConfig` (**11/11**, 2026-09-04). See [`VALIDATION.md`](VALIDATION.md). Unknown config keys are **stripped**, not rejected — still omit Shopify `storeDomain`, Yotpo `siteId`, and lowercase Algolia `appId`.

## License

Internal implementer pack. Copy into the tool that will run the probes.
