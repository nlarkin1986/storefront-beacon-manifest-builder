# nordstrom.com

- platform: **nordstrom_custom_react** (React SSR + loadable chunks + Sanity homepage; Fastly; Imperva bot wall). Not SFCC/Shopify.
- platform host: `www.nordstrom.com` (BFF under `/api/*`; media `n.nordstrommedia.com`)
- mcp: **missing** (`/.well-known/mcp.json` → SPA 404 HTML; no OpenAPI/graphql/llms)
- webmcp: unknown
- public rest bound: **partial** — HTML JSON-LD product + policy/CS pages; proprietary `/api/style` + `/api/search/*` exist but **403 a32** (Akamai sensor headers required)
- tools bound:
  1. `get_product` — html:`/s/{slug}/{styleId}` JSON-LD Product — **high** (AG Brinley jeans 8566706 → $164.50, rating 4.4/8)
  2. `search_policies` — html:`/browse/services/return-policy`, shipping-methods-charges, customer-service, FAQ, privacy, international — **high**
  3. `list_collections` — html:`/browse/{path}` PLP anchors — **medium** (women → 71 PDPs; not keyword search)
- gaps:
  - `search_catalog` — `/api/search/v2` + `/api/search/query/{q}/` → **403 a32** without Akamai `X-y8S6k3DB-*` headers; `/sr` HTML Imperva + robots Disallow
  - `get_product` REST — `/api/style/{id}` same a32 gate (shoppertoken JWT alone insufficient)
  - cart/checkout — not bound; no showCheckout
  - order lookup / returns start — account HTML (`/signin/order-lookup`, `/my-account/blank-return`) needs_auth
  - BV Conversations live — **clientName `nordstrom`** confirmed; **passkey missing** from deployment configs
- demo_ready: **yes**
- why: `get_product` (high) + `search_policies` (high) from live HTTP. Enough for Sidekick product Q + policy answers without catalog keyword search or cart.
- origin after redirects: `https://www.nordstrom.com` (`nordstrom.com` → 301 www; `shop.nordstrom.com` → www)
- Beacon note: **common = bazaarvoice only** (`clientName: nordstrom`, `locale: en_US`; no passkey). **custom: []** — do not invent fake commons for Nordstrom BFF. Beacon Builder should later add a custom bundle once Akamai-session capture unblocks `/api/search/*` and `/api/style/*`.
- Intended custom tool names (for Beacon Builder; not in beacon custom[]):
  - `searchProducts` → `GET /api/search/query/{q}/` or `/api/search/v2`
  - `getProduct` → `GET /api/style/{styleId}`
  - `browseCategory` → HTML `/browse/{path}` or future BFF browse
  - `searchPolicies` → HTML policy URLs above
- bazaarvoice: deployments **`nordstrom`** / `Nordstrom` main_site production en_US; displayCode **4094**; bv.js 200; Conversations enabled; passkey not in ManifestConfig and not found in api-config
- published discovery notes:
  - Prefer Googlebot UA + `--compressed` for SSR HTML; browser UA hits Imperva `istlWasHere`
  - robots Allow `/api/ng-looks/` + `/api/recs/` only under `/api/*`
  - `api.nordstrom.com` → 503 TLS issuer failure from this egress
  - No Algolia / Constructor / Bloomreach / PowerReviews live keys in SSR
- do not do next: Playwright HAR unless demo specifically needs keyword search; then capture Akamai sensor cookies from a real browser session
- discovered_at: 2026-09-04T06:25:00-05:00
- files:
  - `/workspace/nordstrom.com.manifest.json`
  - `/workspace/nordstrom.com.report.md`
  - `/workspace/nordstrom.com.beacon-manifest.json`
