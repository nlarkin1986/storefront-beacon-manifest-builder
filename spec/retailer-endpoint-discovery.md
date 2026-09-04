# Retailer endpoint discovery → Gladly / WebMCP manifest

Pass this file to Grokbot as the working spec. Goal: given a storefront URL, produce a bound manifest of Gladly-shaped tools **without click-tour HAR capture**.

Do not drive the UI first. Treat the site as published contracts. Browser sniff is last resort only.

---

## Problem

Current workflow: open the retailer site, click through search / PDP / cart / policies, capture network activity, hand-build a Demo Buddy / WebMCP manifest.

That is slow, path-dependent, and mixes commerce APIs with analytics beacons. It does not scale to trials.

Replacement: **fixed Gladly tool list + candidate HTTP/MCP calls + prospect origin → probe → bind what answers.**

```
manifest.candidates  +  https://acme.com  →  live bindings
```

The URL is the variable. The endpoints (candidates) are the constants.

---

## What to emit

For each prospect URL, write:

1. `{domain}.manifest.json` — bound tools only
2. `{domain}.report.md` — platform, hits, gaps, demo-ready yes/no

Do not dump raw HAR. Cap shopper tools at 8–12.

---

## Gladly canonical tools (keep this list fixed)

These are intents, not raw routes. Map every discovered call onto one of these.

| Tool | Gladly use | Typical auth |
|---|---|---|
| `search_catalog` | Sidekick product Q, Chat quick actions | none |
| `get_product` | PDP detail, variants, price, availability | none |
| `list_collections` | Browse / nav | none |
| `get_cart` | Cart state | none or session cookie |
| `update_cart` | Add / change qty (demo only, careful) | session cookie |
| `search_policies` | Returns, shipping, warranty | none |
| `lookup_order` | WISMO, order details | auth / Lookup Adaptor |
| `create_return` | Return / exchange | auth / App Platform |

Server-side probes will usually bind the first six (public). Mark `lookup_order` and `create_return` as `gap: needs_auth` unless the prospect gave credentials.

Gladly does not natively speak `/products.json`. The manifest is the contract. Runtime adapters:

- **App Platform / Lookup Adaptor** — authenticated customer + order JSON → Gladly cards
- **Sidekick tools / Guides** — executor hits the bound URL for the canonical tool name
- **WebMCP / in-page agent** — same tools, shopper cookies, cart session

Write tool descriptions for an LLM, not a developer.

---

## Pipeline (run in this order, stop early when possible)

### 0. Normalize origin

Input may be a PDP or collection URL. Resolve:

- origin (`https://www.acme.com`)
- apex (`acme.com`)
- siblings to also probe: `shop.`, `api.`, `developer.`, `docs.`, `www.`
- redirects
- platform host if visible (`*.myshopify.com`, SFCC demandware host, `*.myshopify.com` from CNAME or HTML)

Probe **origin + siblings**, not only the pasted path.

### 1. Published discovery (parallel GET / POST, no browser)

Agent / MCP:

```
GET  /llms.txt
GET  /llms-full.txt
GET  /agents.md
GET  /.well-known/mcp.json
GET  /.well-known/mcp/server-card.json
GET  /.well-known/ucp
GET  /.well-known/ai
GET  /.well-known/ai-plugin.json
GET  /.well-known/api-catalog
GET  /.well-known/integrations.json
GET  /.well-known/oauth-authorization-server
POST /api/mcp          tools/list
POST /api/ucp/mcp      tools/list
POST /mcp              tools/list
```

MCP probe body:

```json
{ "jsonrpc": "2.0", "id": "1", "method": "tools/list" }
```

Specs:

```
GET /openapi.json
GET /openapi.yaml
GET /swagger.json
GET /swagger.yaml
GET /api/openapi.json
GET /v1/openapi.json
GET /docs/openapi.json
POST /graphql          introspection (if open)
POST /api/graphql
```

Indexes:

```
GET /robots.txt
GET /sitemap.xml
GET /sitemap_index.xml
```

Follow links inside `llms.txt`, robots, and api-catalog that look like openapi / swagger / graphql / mcp / reference / api.

**If `POST /api/mcp` or `/api/ucp/mcp` returns tools: bind those to canonical names and treat shopper-side discovery as done.** Shopify often dies here on purpose. Do not keep probing for REST unless MCP is missing a needed intent (usually cart vs catalog are split across `/api/mcp` and `/api/ucp/mcp`).

Optional oracle (do not hard-depend): `GET https://integrations.sh/api/{domain}/detect`

### 2. Fingerprint platform (one homepage GET + headers)

| Signal | Platform |
|---|---|
| `cdn.shopify.com`, `X-ShopId`, `/cdn/shop/`, `window.Shopify`, `/products.json` | shopify |
| `/wp-json/`, `wp-content`, generator WordPress | wordpress |
| `/wp-json/wc/`, `woocommerce` | woo |
| `stencil`, `bigcommerce.com` | bigcommerce |
| `mage-`, Magento `/graphql` | adobe_commerce |
| `demandware`, `dwac_` | sfcc |
| `__NEXT_DATA__`, `_next/data` | next_headless |
| `myshopify.com` in source but custom domain | shopify (custom domain) |

WordPress special case: `GET {origin}/wp-json/` is a route index. Use it.

GraphQL special case: if introspection is open, treat the schema as the catalog.

### 3. Load canned pack for that platform

Do not rediscover Shopify cart on every prospect. Packs live in this spec.

Hydrate: actually call public GETs (and MCP `tools/list`). Store example response keys. Use catalog output to feed later calls (first product handle → `get_product`).

Do **not** `POST /cart/add.js` during discovery unless a human is in a demo session. `GET /cart.js` is enough to prove the cart API.

### 4. Structured data (still GET)

Homepage + 2–3 product URLs from sitemap:

- `application/ld+json`: Product, Offer, Organization, FAQPage, ItemList
- `link rel="alternate" type="application/json"`
- Shopify product JSON in page scripts

If no API, `get_product` can be “GET this URL and parse JSON-LD.” `search_policies` can be parsed from `/llms.txt` + policy pages.

### 5. Static JS analysis (replaces most HAR)

GET homepage → collect first-party `<script src>` → download JS → extract:

```
fetch("...")
axios
"/api/[a-z0-9_/-]+"
https://api.
/cart/add
/products.json
graphql endpoint strings
```

Dedupe to path templates (`/api/products/:id`). Classify first-party vs third-party. Drop Segment, GA, Attentive, Gorgias, live-chat beacons into `noise`. They are not tools.

### 6. One instrumented load — last resort only

Only if steps 1–5 produced fewer than 3 usable shopper tools.

Playwright/CDP once:

1. Navigate home
2. Do not click around
3. Collect XHR/fetch for 5–8 seconds
4. Optionally hit known URLs (`/products/{handle}`), not CSS selectors
5. Diff against static findings
6. Stop

Browser is a packet sniffer here, not a shopper.

### 7. Map → bind → write

For each canonical tool, try candidates in order. First response that matches expected shape wins.

```
for tool in canonical_tools:
  for candidate in tool.candidates:
    url = join(origin_or_sibling, candidate.path)
    res = http(candidate)
    if shape_ok(res, candidate.expected):
      bind(tool, url, source, confidence)
      break
  else:
    mark gap
```

---

## Candidate packs

### Shopify

Auth for these: none (storefront).

```
POST {origin}/api/mcp
POST {origin}/api/ucp/mcp
GET  {origin}/products.json?limit=10
GET  {origin}/collections.json
GET  {origin}/collections/{handle}/products.json
GET  {origin}/products/{handle}.js
GET  {origin}/search/suggest.json?q={q}
GET  {origin}/search.json?q={q}
GET  {origin}/cart.js
POST {origin}/cart/add.js          # demo only, not discovery
GET  {origin}/llms.txt
GET  {origin}/agents.md
GET  {origin}/.well-known/ucp
```

Also try the same paths on `{shop}.myshopify.com` if resolved.

MCP tool name mapping (when `tools/list` works):

| MCP / WebMCP name | Canonical |
|---|---|
| `search_shop_catalog` / `search_catalog` | `search_catalog` |
| `get_product` / `get_product_details` / `lookup_catalog` | `get_product` |
| `browse_store` | `list_collections` |
| `get_cart` | `get_cart` |
| `update_cart` | `update_cart` |
| `search_shop_policies_and_faqs` | `search_policies` |
| `proceed_to_checkout` | do not bind for trial writes; note as handoff only |

Prefer MCP bindings over REST when both live.

### WooCommerce

```
GET {origin}/wp-json/
GET {origin}/wp-json/wc/store/v1/products
GET {origin}/wp-json/wc/store/v1/products?search={q}
GET {origin}/wp-json/wc/store/v1/products/categories
GET {origin}/wp-json/wc/store/v1/cart
GET {origin}/wp-json/wc/v3/products     # usually auth; mark if 401
```

### WordPress (non-Woo)

```
GET {origin}/wp-json/
```

Use route index + JSON-LD + policies. Thin catalog unless a commerce plugin namespace appears.

### BigCommerce

```
GET {origin}/api/storefront/products
GET {origin}/api/storefront/carts
```

### Generic / unknown

```
well-known + openapi + graphql introspection
JSON-LD Product / FAQPage
first-party /api/* from JS extract
```

Read-only tools only unless a clear cart route is confirmed.

---

## Bound manifest shape

```json
{
  "domain": "acme.com",
  "origin": "https://www.acme.com",
  "platform": "shopify",
  "platform_host": "acme.myshopify.com",
  "demo_ready": true,
  "discovered_at": "2026-09-03T18:00:00-05:00",
  "surfaces": {
    "storefront_mcp": "https://www.acme.com/api/mcp",
    "ucp_mcp": "https://www.acme.com/api/ucp/mcp",
    "webmcp": "unknown"
  },
  "tools": [
    {
      "tool": "search_catalog",
      "confidence": "high",
      "source": "mcp:/api/mcp",
      "auth": "none",
      "transport": "mcp",
      "call": {
        "method": "POST",
        "url": "https://www.acme.com/api/mcp",
        "body": {
          "jsonrpc": "2.0",
          "id": "1",
          "method": "tools/call",
          "params": {
            "name": "search_shop_catalog",
            "arguments": { "query": "{q}" }
          }
        }
      },
      "example_keys": ["content"],
      "gladly_use": "Sidekick product questions"
    }
  ],
  "gaps": [
    {
      "tool": "lookup_order",
      "reason": "needs_auth",
      "hint": "Gladly Lookup Adaptor / Customer Account MCP / OMS"
    }
  ],
  "noise_rejected": ["segment.com", "google-analytics.com"]
}
```

Confidence:

- `high` — MCP tools/list or hydrated platform pack with expected JSON
- `medium` — REST/JSON-LD works, shape inferred
- `low` — JS extract or single sniff, unproven schema

---

## How to call (runtime and discovery)

Three styles:

1. **Public REST, same origin** — `GET {origin}/products.json`. No auth. Normal HTTP client. Follow redirects. If datacenter IP is 403’d, retry once via browser context; still no clicking.
2. **JSON-RPC MCP, same origin** — `POST {origin}/api/mcp` `tools/list` then `tools/call`. Best Gladly-shaped result.
3. **Authenticated / other host** — orders, refunds, subscriptions. Do not pretend a 401 is “missing.” Mark `auth_required`. These go through Gladly App Platform / Lookup Adaptor, not the public homepage.

Calling tells you availability + a sample payload for public tools. It does not give a real customer order.

Result classes to store:

| HTTP / body | Store as |
|---|---|
| 2xx + expected JSON | bound |
| 2xx + HTML / empty | reject |
| 401 / 403 | `auth_required` if path looks real |
| 404 | try next candidate |
| timeout / challenge | optional one sniff for that call only |

Binding rules:

- Resolve origin after redirects (`www` vs apex vs `shop.`)
- Try custom domain and platform host
- Fill templates from prior successes (`{handle}`, `{variant_id}` from `/products.json`)
- No write probes in discovery
- Server probe ≠ shopper session. Cart *writes* need in-page WebMCP or a real demo tab

---

## Cloudflare WebMCP (only if relevant)

Cloudflare’s dashboard WebMCP toggle is **transport**, not discovery.

- Edge injects `/.webmcp/bridge.js`
- Packs in preview: C2PA + proxy to same-origin `/mcp`
- It does **not** invent `search_catalog`
- Useful when prospect is orange-clouded **and** you already have `/mcp` or `/api/mcp`
- May need a tiny Worker: `/mcp` → proxy `/api/mcp`
- Verify: `curl -s https://origin | grep webmcp`
- Safari: no-op. Test with Chromium / Cloudflare Browser Run `lab=true`

Do not promise the toggle as a catalog adapter.

---

## Report template

```md
# {domain}

- platform:
- platform host:
- mcp: live / missing (paths)
- webmcp: native / cloudflare / unknown
- public rest bound:
- tools bound:
- gaps:
- demo_ready: yes/no
- why:
- do not do next: click-tour unless gaps remain after JS extract
```

`demo_ready: yes` when at least `search_catalog` or `get_product` **and** `search_policies` (or MCP policy tool) bind at `high`/`medium`. Cart is a plus, not required for a first Sidekick trial.

---

## What Grokbot must not do

- Click through the store as the primary discovery method
- Put analytics / ads / chat beacons in `tools`
- Expose admin GraphQL or payment complete as shopper tools
- Bind `complete_checkout` / charge endpoints for a trial
- Claim order lookup works from a public homepage
- Re-derive the Shopify pack from scratch each run
- Output 80 raw routes instead of ≤12 canonical tools

---

## Suggested run prompt for Grokbot

```
Read retailer-endpoint-manifest-grokbot.md.
Target URL: {PASTE}
Run the pipeline. Do not click the UI unless step 6 is required.
Write {domain}.manifest.json and {domain}.report.md.
Prefer MCP bindings over REST.
Mark auth gaps instead of guessing OMS routes.
```

---

## Notes for humans

- Shopify Liquid already ships storefront MCP + often WebMCP tools. Consume them.
- Gladly Lookup Adaptor remains the path for authenticated WISMO / returns.
- Demo Buddy paste-URL box should call this detector, then seed the Guide with only bound canonical tool names.
- HAR is a diff tool after the fact (“this Hydrogen theme does not use `/cart/add.js`”), not the catalog builder.
