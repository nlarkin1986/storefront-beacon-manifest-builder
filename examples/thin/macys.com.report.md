# macys.com

- platform: **macys_custom_xapi** (proprietary WSSG `api.macys.com` v4 catalog + first-party `xapi` digital/mobileapp; Help Center CMS; Returns Center Nuxt). Not Shopify. SFCC/demandware **not confirmed** (homepage SSR unreachable).
- platform host: `www.macys.com` (APIs: `api.macys.com`, `www.macys.com/xapi/*`; media `slimages.macysassets.com`)
- mcp: **missing** (well-known/MCP/OpenAPI/graphql/llms/robots/sitemap → Akamai BVM 403 HTML)
- webmcp: unknown
- public rest bound: **partial** — Bazaarvoice Conversations `products.json` / `reviews.json` live; Help Center policy HTML via WebFetch; storefront + WSSG/xapi **403 AkamaiGHost**
- tools bound:
  1. `search_catalog` — BV `products.json?Search=` — **medium** (jeans → TotalResults 120313; ids/names; no WSSG price facets)
  2. `get_product` — BV `products.json?Filter=Id:` — **medium** (26288273 Lauren Ralph Lauren sandals; brand, description, image, ProductPageUrl, AVAILABILITY, rating 4.0/2; **no price**)
  3. `search_policies` — html:`/customer-service/articles/*` + `/returns` — **high** (returns, shipping options/FAQs, exchanges, international)
- gaps:
  - WSSG `GET /v4/catalog/search` + `/v4/catalog/product/{id}` + `xapi/digital/v1/product/{id}` + `xapi/mobileapp/browse/v1/search` → **403** Akamai Bot Manager (`ACCESS_DENIAL_PAGE_BVM`) from datacenter egress; needs registered `x-macys-webservice-client-id` + likely sensor/session
  - PDP HTML JSON-LD / PLP `list_collections` — same BVM gate (box curl); WebFetch reaches Help Center but not `/shop/product`
  - cart/checkout — not bound; **no showCheckout**
  - order lookup / start return — `/returns` shell public; flows **needs_auth**
  - BV Conversations — **clientName `Macys`** + displayCode **7129** confirmed; `conversationAPIKey` empty in reviews_collect-config; **mprAPIKey from ratings-config works as Conversations passkey** (document in discovery only — **not** ManifestConfig)
- demo_ready: **yes**
- why: `search_catalog` (medium) + `get_product` (medium) via BV **and** `search_policies` (high) from Help Center. Enough for Sidekick product identity/ratings + policy Q; price/inventory still need custom xapi/v4 after Akamai bypass.
- origin after redirects: `https://www.macys.com` (`macys.com` → www; still 403)
- Beacon note: **common = bazaarvoice only** (`clientName: Macys`, `locale: en_US`, `bfdToken: 7129,main_site,en_US`; **no passkey**). **custom: []** — do not invent fake commons for Macy's BFF. Beacon Builder should later add a custom bundle once Akamai-session / client-id unblocks `api.macys.com` and `xapi/*`.
- Intended custom tool names (for Beacon Builder; not in beacon custom[]):
  - `searchProducts` → `GET /v4/catalog/search` or `/xapi/mobileapp/browse/v1/search`
  - `getProduct` → `GET /xapi/digital/v1/product/{id}` or `/v4/catalog/product/{id}`
  - `browseCategory` → HTML `/shop/{path}` or future category API
  - `searchPolicies` → HTML Help Center URLs below
- bazaarvoice: deployment path **`macys`** / client **`Macys`** main_site production en_US; displayCode **7129**; bv.js 200; Conversations enabled; display `static/Macys/main_site/en_US/bvapi.js` 200; passkey discovered as ratings `mprAPIKey` (HTTP discovery bind only)
- published discovery notes:
  - Prefer WebFetch-class / residential egress for Help Center; box Googlebot+`--compressed` still BVM-denied
  - `developer.macys.com` NXDOMAIN from this egress (docs historically describe v4 + `x-macys-webservice-client-id`)
  - No Algolia / Constructor / Bloomreach / PowerReviews / Yotpo live keys observed
  - Sibling `bloomingdales.com` also Akamai Access Denied
  - Wayback offline during run; jina reader blocked (IP reputation)
- do not do next: Playwright HAR unless demo specifically needs live price/UPC maps; then capture Akamai cookies + valid webservice client-id from a real browser/app session
- discovered_at: 2026-09-04T06:37:00-05:00
- files:
  - `/workspace/macys.com.manifest.json`
  - `/workspace/macys.com.report.md`
  - `/workspace/macys.com.beacon-manifest.json`
