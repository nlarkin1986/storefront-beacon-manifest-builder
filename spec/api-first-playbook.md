# API-first Gladly / Beacon manifest — full approach

**Audience:** Manifest Builder, Beacon Builder, Demo Buddy / Sidekick trials  
**Generated:** 2026-09-03 (America/Chicago)  
**Status:** Working method proven on Quince, Vuori, Gap — no click-tour HAR as primary discovery

---

## 1. Best approach (one paragraph)

Treat every storefront as **published contracts**, not a UI to click. Probe HTTP (well-known, MCP, platform packs, static JS key scrape, JSON-LD). Bind what answers onto either (A) a **discovery binding file** for humans/agents or (B) a **Beacon manifest** that Demo Buddy can load. Prefer MCP when live; otherwise REST/search vendors; reviews via registry commons (Bazaarvoice, Yotpo, …). Customer-owned BFFs (Gap `api.gap.com`) go in **`integrations.custom`** with a real `bundleUrl`, never as a fake common vendor. Cart writes and order/return stay auth gaps unless you have shopper session / Lookup Adaptor. Browser sniff is last resort only.

```
storefront URL
    → HTTP discovery (no Playwright unless <3 shopper tools)
    → platform + vendor fingerprint
    → live bind candidates
    → beacon-manifest.json  (common + core + custom)
    → Beacon Builder ships custom bundle / playbook / Guide
```

---

## 2. Two artifacts (do not conflate)

| Artifact | Purpose | Shape |
|---|---|---|
| **Discovery binding** | What we proved live over HTTP | `{domain}.manifest.json` — Gladly-canonical tools (`search_catalog`, `get_product`, …), URLs, headers, example_keys, gaps |
| **Beacon manifest** | What Demo Buddy / server agent loads | `beacon-manifest-{uuid}.json` — `version` `1.0`, `generatedAt`, `integrations.core` / `common` / `custom` |

Nate’s rule: **ship Beacon format** for product use. Keep the discovery file as the probe log and endpoint source of truth for builders.

### Beacon top-level shape (required)

```json
{
  "version": "1.0",
  "generatedAt": "2026-09-03T00:00:00.000Z",
  "integrations": {
    "core": { "tools": [ /* extracted from chat-sdk core/index.ts */ ] },
    "common": [
      {
        "name": "bazaarvoice",
        "config": { "clientName": "the-gap", "locale": "en_US" },
        "tools": [ /* name + description + inputSchema (+ annotations/outputSchema) from source */ ]
      }
    ],
    "custom": [
      {
        "name": "gap",
        "bundleUrl": "https://…/gap-bundle.js",
        "tools": [ /* full schemas; handlers live in the bundle */ ]
      }
    ]
  }
}
```

**Tool object fields only:** `name`, `description`, `inputSchema`, optional `outputSchema`, optional `annotations`.  
**Strip** `navigatesPage` and any other SDK-owned fields.

---

## 3. Tiers (ownership, not “reuse”)

From chat-sdk docs / `beacon-manifest` skill:

| Tier | Who owns the API | Runs where | Examples |
|---|---|---|---|
| **core** | SDK | Parent page / DOM | `navigateToUrl`, `findElements`, `clickElement`, `getPageContext`, … |
| **common** | 3rd-party **vendor** | Parent widget context | `shopify`, `algolia`, `bazaarvoice`, `sfcc`, `sap-commerce`, … |
| **custom** | **Customer** endpoints / bespoke flows | Sandboxed iframe + brokered fetch | Gap `api.gap.com`, Balsam Hill `findMyTree` |

Rules:

1. `common[].name` must be a `COMMON_INTEGRATIONS` / registry key.
2. `common[].config` must validate against that integration’s `*ManifestConfig` in `config.ts`.
3. Do **not** invent a common named `gap-commerce`. Gap’s Apigee APIs are **custom**.
4. Custom entries need `name` + `bundleUrl` + `tools[]` (see Balsam Hill).
5. Extract tool schemas from `web-v2/src/integrations/{name}/index.ts` via esbuild — don’t hand-transcribe.

---

## 4. Discovery pipeline (Manifest Builder)

Run in order. Stop early when possible. **No UI click-tour.**

### 0. Normalize origin

- Resolve redirects → `origin`, apex, siblings: `www.`, `shop.`, `api.`, `developer.`, `docs.`
- Detect platform host: `*.myshopify.com`, SFCC demandware, Apigee, etc.
- Probe **origin + siblings**, not only the pasted path.

### 1. Published discovery (parallel GET/POST)

```
GET  /llms.txt  /llms-full.txt  /agents.md
GET  /.well-known/mcp.json  /.well-known/mcp/server-card.json
GET  /.well-known/ucp  /.well-known/ai  /.well-known/ai-plugin.json
GET  /.well-known/api-catalog  /.well-known/integrations.json
GET  /.well-known/oauth-authorization-server
POST /api/mcp  /api/ucp/mcp  /mcp
     body: {"jsonrpc":"2.0","id":"1","method":"tools/list"}
GET  /openapi.json|/yaml  /swagger.json|/yaml  /api/openapi.json  /v1/openapi.json  /docs/openapi.json
POST /graphql  /api/graphql   (introspection if open)
GET  /robots.txt  /sitemap.xml  /sitemap_index.xml
```

If MCP `tools/list` returns tools → map to canonical intents and prefer MCP over REST.

Optional: `GET https://integrations.sh/api/{domain}/detect` (do not hard-depend).

### 2. Fingerprint platform

One homepage GET + headers / HTML signals:

| Signal | Platform |
|---|---|
| `cdn.shopify.com`, `window.Shopify`, `/products.json` | shopify |
| Storefront token / `/api/20xx-xx/graphql.json` | shopify-storefront |
| `demandware`, `dwac_` | sfcc |
| `/occ/v2/` | sap-commerce |
| `algolianet.com`, algolia appId in JS | algolia |
| `bv.js`, `BV.` | bazaarvoice |
| `api.gap.com`, onesite Next | gap_custom_next (→ **custom** bundle) |

### 3. Canned vendor / platform packs

Hydrate with real GETs. Store example_keys.  
**Do not** write-probe cart add during discovery. `GET /cart.js` is enough to prove Ajax cart.

Packs live under Manifest Builder `manifest-packs/` and chat-sdk `integrations/*/`.

### 4. Structured data

Homepage + 2–3 PDP URLs: JSON-LD Product/Offer/FAQPage, `link rel=alternate type=application/json`.

### 5. Static JS analysis (replaces most HAR)

Download first-party scripts → extract `fetch(`, `/api/…`, algolia keys, storefront tokens.  
Drop analytics (Segment, GA, Attentive, Mixpanel, …) into `noise_rejected`.

### 6. One instrumented load — last resort

Only if steps 1–5 yield **fewer than 3** usable shopper tools. Navigate home, collect XHR 5–8s, **do not click around**.

### 7. Map → bind → write

For each intent, first candidate that returns expected JSON wins. Emit discovery binding + Beacon stub.

---

## 5. Gladly-canonical intents (discovery layer)

Fixed list — map every vendor call onto these for the discovery file:

| Tool | Typical auth | API-first demo? |
|---|---|---|
| `search_catalog` | none | Yes |
| `get_product` | none | Yes |
| `list_collections` | none | Yes |
| `get_cart` | session / OAuth | Partial |
| `update_cart` | session | Demo tab / WebMCP only |
| `search_policies` | none | Yes |
| `lookup_order` | Lookup Adaptor | No — mark `needs_auth` |
| `create_return` | App Platform | No — mark `needs_auth` |

`demo_ready: yes` when (`search_catalog` **or** `get_product`) **and** `search_policies` bind at high/medium.

---

## 6. Beacon tool naming (product layer)

In the **Beacon** file, use **chat-sdk tool names** from the integration that owns the call:

| Discovery intent | Common example | Custom example (Gap) |
|---|---|---|
| `search_catalog` | `algolia.searchProducts` / `shopify.searchProducts` | `gap.searchProducts` |
| `get_product` | `shopify.getProduct` | `gap.getProduct` |
| `list_collections` | Algolia facets / Shopify collections | `gap.browseCategory` |
| `search_policies` | Shopify MCP `search_shop_policies_and_faqs` | `gap.searchPolicies` |
| reviews | `bazaarvoice.getProductReviews` | — |
| DOM | `core.navigateToUrl` | — |

Do **not** put Gladly-canonical names inside `integrations.custom[].tools` unless the custom bundle literally implements those names.

---

## 7. Valid `common` config keys (this SDK revision)

Source: chat-sdk `web-v2/src/integrations/*/config.ts`. Extra keys from older manifests may be ignored or invalid.

| integration | Notes on config |
|---|---|
| `algolia` | Optional `appId`, `apiKey`, `indexName`, `suggestionsIndexName`, mapping* (detect OK) |
| `bazaarvoice` | Optional `clientName`, `bfdToken`, `locale` — **not** `passkey` |
| `yotpo` | Optional `appKey` — **not** `siteId` |
| `shopify` | Optional `searchLimit`, mapping* — **no** `storeDomain` in this revision |
| `shopify-storefront` | **Required** `shopDomain`; optional `storefrontAccessToken`, `apiVersion`, metafields, articleBlogs, … |
| `searchspring` | `siteId` |
| `constructorio` | `key` |
| `sap-commerce` | `baseSite`, `apiBase`, csrf*, checkoutOperations, … (lint required) |
| `sfcc` | siteId / controllers / locale / currency / patterns |
| `powerreviews` | `merchantId`, `apiKey`, … |
| others | See `/workspace/beacon-manifest-config-reference.md` |

---

## 8. HTTP-only coverage of Demo Buddy registry (25)

Score (yes=1.0, partial=0.6, no=0): **72 / 100**

- **yes (10):** algolia, boost, chilipiper, constructorio, dynamicyield, marketo, searchspring, shopify, shopify-storefront, unbxd  
  (note: chilipiper/dynamicyield/marketo are detect-only for shopper tools)
- **partial (13):** bazaarvoice, klaviyo-reviews, magento, okendo, powerreviews, reviewsio, sap-commerce, servicify, sfcc, stockist, sweetiq, trustpilot, yotpo
- **no (2):** stylitics (noise), turnto (needs authKey)

Shopper-tool hydrate without browser (solid): platforms + search listed above. Reviews usually need a public key from static JS then vendor read API.

---

## 9. Result classes

| HTTP / body | Store as |
|---|---|
| 2xx + expected JSON | bound |
| 2xx + HTML / empty | reject |
| 401 / 403 on real path | `auth_required` / gap |
| 404 | next candidate |
| WAF / challenge | one sniff optional |

Confidence: **high** = MCP or hydrated pack; **medium** = REST/JSON-LD or session-proven 401; **low** = JS-only guess.

---

## 10. What never to do

- Click-tour as primary discovery
- Hand-write common tool schemas (extract from source)
- Invent common integrations for customer BFFs
- Put analytics beacons in `tools`
- Bind checkout complete / charge endpoints for trials
- Claim public `lookup_order`
- Write-probe `POST /cart/add` during discovery
- Ship name-only tools (server agent has no fallback for custom)
- Use wrong config keys (`passkey` on BV, `siteId` on Yotpo, invented `storeDomain` on shopify)

---

## 11. Division of labor

| Role | Owns |
|---|---|
| **Manifest Builder** | URL → HTTP probe → discovery binding → Beacon JSON (valid configs + extracted schemas) |
| **Beacon Builder** | Custom bundles (`bundleUrl` + handlers), playbooks, Guides, themes, mcpproxy, chat-sdk PRs |

Handoff package per prospect:

1. `{domain}.manifest.json` — live URLs/headers  
2. `{domain}.report.md` — platform / mcp / demo_ready  
3. `beacon-manifest-{uuid}.json` — loadable Beacon file  
4. Notes: auth gaps, noise, which custom tools to implement

---

## 12. Case studies

### Quince (`quince.com`) — headless Next, no MCP

| Intent | Binding |
|---|---|
| search | Algolia `quince_product_color_index_v1` |
| product | `api-prod-public.onequince.com` BFF product cards |
| collections | Algolia facets |
| policies | Gladly Help Center answers API |
| cart | session 401 |

`demo_ready: yes`. Beacon would use `common: [algolia, …]` + optional custom if BFF preferred over Algolia.

Files: `/workspace/quince.com.manifest.json`, `quince.com.report.md`

### Vuori (`vuoriclothing.com`) — Shopify + Algolia + Yotpo

Reference Beacon: Nate’s Downloads `beacon-manifest-33fefd9c-…` / attachment.

HTTP replication: **16/19** common tools yes; Yotpo Reviews account missing (Loyalty siteId); metafields ACCESS_DENIED; core DOM = not API-only.

Live hosts: Algolia `P2MLBKGFDS` / `us_products`; Ajax + MCP on `checkout.vuoriclothing.com`; Storefront GraphQL often works **without** token.

Files: `/workspace/vuori-api-replication.md`, `vuori.clothing.manifest.json`

### Gap (`gap.com`) — custom Next + Apigee + BV

| Intent | Binding |
|---|---|
| search | `GET api.gap.com/commerce/search/products/v2/cc?keyword={q}&brand=gap` |
| product | `GET …/catalog_products/v3/products?product_id={pid}&market=US&brand=GAP` |
| collections | same search with `cid=` + division sitemap |
| policies | `/customer-service/*` HTML |
| reviews | Bazaarvoice (manifest config: `clientName: "the-gap"`, `locale: "en_US"`) |
| cart | `commerce/shopping-bags` OAuth → gap |

**Beacon source of truth:**  
`/workspace/gap.com.beacon-manifest.json`  
(= `beacon-manifest-16112862-ec2d-46b5-bf5d-0ccb77f88a30.json`)

Do **not** use `beacon-manifest-9169ca18-…` (invalid invented `gap-commerce` common).

Discovery bindings: `/workspace/gap.com.manifest.json`, `gap.com.report.md`

**AI commerce demo plan for Gap:**

1. `common`: bazaarvoice only  
2. `custom`: gap bundle — `searchProducts`, `getProduct`, `browseCategory`, `searchPolicies`  
3. `core`: navigate / highlight / findElements  
4. No fake cart  

Headers that worked:

```
Accept: application/json          # search / browse
Accept: application/vnd.snake+json  # product STYLE
X-Client-Application-Name: Ecom
```

---

## 13. Sidekick demo script (API-first)

Works without browser on demo_ready sites:

1. Search catalog → product cards  
2. Open one product → variants / price  
3. Reviews (if BV/Yotpo/… bound)  
4. Policy question → returns / shipping  
5. Optional: core navigate to PDP for “show me”

Skip: cart mutate, WISMO, returns create — unless auth path exists.

---

## 14. Suggested run prompts

### Manifest Builder (discovery + beacon)

```
Target URL: {PASTE}
Run API-first pipeline. No UI click unless step 6 required.
Write {domain}.manifest.json and {domain}.report.md.
Then emit beacon-manifest-{uuid}.json:
  - common: only registry integrations with valid ManifestConfig
  - tools: schemas from chat-sdk source
  - custom: [] unless a real customer bundle is planned (list intended tool names in the report)
Prefer MCP over REST. Mark auth gaps. Prefer Beacon shape for delivery.
```

### Beacon Builder (Gap custom)

```
Read /workspace/gap.com.manifest.json + gap.com.beacon-manifest.json.
Scaffold custom integration `gap` (balsamhill shape: name + bundleUrl + tools).
Tools: searchProducts, getProduct, browseCategory, searchPolicies.
Wire to proved api.gap.com endpoints/headers.
Keep bazaarvoice common as in beacon file.
No cart OAuth fakery.
```

---

## 15. File map (this workspace)

| Path | Role |
|---|---|
| `api-first-ecommerce-demo-api-calls.md` | Earlier API call reference (Quince + packs) |
| `demo-buddy-http-only-scorecard.md` / `.json` | 25-integration HTTP feasibility |
| `manifest-packs/*.json` | Detector stubs |
| `quince.com.manifest.json` / `.report.md` | Quince discovery |
| `vuori-api-replication.md` / `vuori.clothing.manifest.json` | Vuori replication |
| `gap.com.manifest.json` / `.report.md` | Gap discovery (endpoint truth) |
| `gap.com.beacon-manifest.json` | Gap Beacon source of truth |
| `beacon-manifest-config-reference.md` | Config key cheat sheet |
| `beacon-ref/chat-sdk-master/` | Unpacked chat-sdk (skills, integrations, balsamhill example) |

Chat-sdk skills to follow when building product artifacts:

- `.claude/skills/beacon-manifest/SKILL.md`
- `.claude/skills/beacon-investigate-site/SKILL.md`
- `.claude/skills/beacon-add-common-integration/SKILL.md`
- `.claude/skills/beacon-playbook/SKILL.md`
- `docs/beacon-customer-setup-guide.md`
- `docs/adding-a-common-integration.md`

---

## 16. Success checklist

- [ ] Discovery file has only live-proven bindings + explicit gaps  
- [ ] Beacon `version` `1.0` + RFC3339 `generatedAt`  
- [ ] Every tool has non-empty `name`, `description`, `inputSchema`  
- [ ] No unexpected tool keys (`navigatesPage` stripped)  
- [ ] Every `common[].config` matches ManifestConfig  
- [ ] Customer BFF tools only under `custom` with `bundleUrl` plan  
- [ ] `demo_ready` judgment documented in report  
- [ ] Manifest Builder ↔ Beacon Builder handoff paths listed  

---

## 17. Bottom line

**API-first wins** for catalog, product, collections, policies, and most review vendors — enough for a Gladly AI commerce trial.  

**Beacon compliance** is what makes the JSON loadable: registry commons + extracted schemas + custom bundles for proprietary APIs.  

**Gap is the template** for non-Shopify enterprise: thin valid Beacon (BV + core) + thick custom bundle built by Beacon Builder from Manifest Builder’s proved URLs.
