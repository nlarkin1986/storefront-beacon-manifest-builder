---
name: Path B storefront probe
description: >-
  Use this when probing a retail storefront URL over HTTP to emit discovery +
  Demo Buddy beacon manifests — especially Path B / custom-BFF sites with bot
  walls, vendor commons, or BV fallbacks.
---
# Path B storefront probe

HTTP-only discovery → Gladly discovery JSON + Demo Buddy beacon-manifest. No click-tour HAR. Browser only as last resort.

## Inputs / outputs

- **In:** storefront URL (or domain)
- **Out:** `{domain}.manifest.json`, `{domain}.beacon-manifest.json`, `{domain}.report.md`
- Prefer MCP over REST when live; mark auth gaps; never invent OMS routes or fake commons

## Probe header recipe (P0)

1. Lead with Chrome desktop UA + `Accept-Encoding: gzip` + `Origin`/`Referer` of the storefront
2. Add `Sec-CH-UA` / `Sec-CH-UA-Mobile` / `Sec-CH-UA-Platform` when first-party APIs return Akamai-style 403
3. Optional parallel Googlebot only for HTML/JSON-LD — never as the primary Path B UA (burns Nike/Adidas)
4. Cap: 2 UAs × 1 retry. Classify walls: `akamai_a32` | `akamai_bvm` | `datadome` | `ge401001` | `imperva` | `none`

Stamp every bind with `probed_from`, UA, required headers. Set `egress_fragile: true` when Sec-CH or sensor cookies are required.

## Early fork (after homepage + one JS scan)

```
if Constructor / Algolia / Searchspring keys in JS → hydrate commons FIRST
else if public BFF candidates return 200 → bind BFF
else if Bazaarvoice Conversations products live → BV-as-catalog fallback
else if JSON-LD Product + policy HTML → thin demo_ready
else → blocked_waf / QUEUE
```

Do not chase dead SFCC OCAPI (SiteNotFound) or invent Algolia/SFCC commons from string noise.

## BV-as-catalog

When first-party search is walled but BV `products.json` works:

| Tool | Confidence | Caveat |
|---|---|---|
| search_catalog | medium | often no price |
| get_product | medium/high | identity + ratings + PDP URL |
| get_reviews | high | |
| search_policies | separate binder | |

Beacon `common`: `bazaarvoice` only — `clientName` (+ optional `bfdToken`/`locale`). **Never** `passkey`. Report: prices need custom BFF after session.

## Brand-family (Gap Apigee)

If onesite + `api.gap.com` / `mybrand`:

| Brand | search | catalog |
|---|---|---|
| Gap | `brand=gap` | `brand=GAP` |
| Old Navy | `brand=on` | `brand=ON` |

Emit BV per brand; keep `custom: []` until a real bundle; report: fork gap-integration brand override — not a new BFF.

## Policy confidence

| Grade | When |
|---|---|
| high | Live help HTML 200, extractable |
| medium | URL map + Wayback / i18n only |
| low | Footer links only |

## MCP

Try once in parallel. On 404/503/302 store-closed → `mcp: missing` and continue. Path B batch: treat MCP as rare.

## llms.txt

Accept only if body looks like llms (md/api links), not SPA homepage HTML.

## demo_ready rubric

Keep: `(search_catalog OR get_product) AND search_policies` at ≥ medium.

Add on every discovery emit:

- `demo_ready_quality`: `strong` | `commons` | `bv_fallback` | `thin_html`
- `needs_custom`: `none` | `fork` | `new_bff` | `held_bot_wall`
- `wall_class`: taxonomy above or `none`

## Beacon emit checklist

1. `version: "1.0"` + RFC3339 `generatedAt`
2. `common[]` names ∈ chat-sdk registry only
3. Config keys ⊆ each `*ManifestConfig` (no inventing keys)
4. Tools: only `name` | `description` | `inputSchema` | `annotations` | `outputSchema`
5. No `showCheckout` without `core.config.checkout`
6. `custom: []` unless a real `bundleUrl` exists — intended custom tools live in the **report**, not fake common
7. Prefer tool schemas extracted from chat-sdk `integrations/*/index.ts`

Known config traps: bazaarvoice uses `clientName`/`bfdToken`/`locale` (not passkey); yotpo uses `appKey` (not siteId); shopify has no `storeDomain` in ManifestConfig; TurnTo uses `siteKey` and Nike productId = styleCode not styleColor.

## Never

- Fake cart / showCheckout
- Invented commons for customer BFFs
- Claiming BV fallback has prices/inventory
- Playwright as default
- High confidence for Wayback-only policies
- Blocking the run on missing MCP

## Handoff

When `needs_custom` is `fork` / `new_bff` / `held_bot_wall`, hand Scout/Beacon Builder: domain, wall_class, quality, probe paths, pack hole one-liner — do not implement custom bundles in this lane.
