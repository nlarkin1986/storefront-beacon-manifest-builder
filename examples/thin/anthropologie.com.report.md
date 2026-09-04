# anthropologie.com

- platform: **urbn_a15_spa** (URBN custom Vue SPA + a15Client BFF; Apache + DataDome; Contentful help/CMS; first-party Elasticsearch catalog-search-service). Not Shopify. Not Algolia. Not Constructor. Not SFCC.
- platform host: `www.anthropologie.com` (API twin `api.anthropologie.com`; static `static.anthropologie.com`; images `images.urbndata.com`; BV apps/api.bazaarvoice.com)
- mcp: **missing** (well-known/MCP/OpenAPI/graphql → 404/403; **llms.txt 200**; robots live **403** / Wayback 200; **sitemapindex.xml 200**)
- webmcp: unknown
- public rest bound: **yes** — Bazaarvoice Conversations live without storefront cookies; first-party www/api HTML+JSON **403** DataDome even with Chrome UA + Sec-CH + compressed; sitemaps + llms.txt + static JS succeed
- tools bound:
  1. `search_catalog` — `GET https://api.bazaarvoice.com/data/products.json?Search={q}` passkey from bvapi — **high** (dress → 46201; sweater → 13515; no prices)
  2. `get_product` — BV `Filter=Id:{productId}` — **high** (AN-4113086690011-000 Maeve Carys → 4.64★ / 2542 reviews, PDP `/shop/…`)
  3. `get_reviews` — BV reviews.json client **Anthropologie** / displaycode **5310-en_us** — **high** (2542 reviews)
  4. `get_search_suggestions` — URBN `…/catalog-search-service/v0/an-us/products/sayt/` — **medium** (documented in app.js; live **403**)
  5. `list_collections` — categories_sitemap (~2693) + llms.txt nav — **medium** (maps live; category HTML **403**)
  6. `search_policies` — html:`/help/{topic}` — **medium** (live **403**; Wayback FAQ/online-returns: 30-day returns, $5.95 mail return fee, free ship $50+)
- gaps:
  - Entire shopper HTML + `/api/*` DataDome-walled from this egress
  - First-party search/catalog (prices, inventory, SAYT) blocked — use BV as catalog fallback only
  - No Algolia/Constructor/SFCC — **do not invent those commons**
  - Stylitics cookie on but account unpublished — skip stylitics common
  - cart/checkout — not bound; **no showCheckout**
  - BV passkeys in bvapi.js — **not** ManifestConfig fields (omit)
- demo_ready: **yes**
- why: `search_catalog`/`get_product` (high) via public Bazaarvoice products API **and** `search_policies` (medium) via help URL map + Wayback-validated content. ≥3 shopper tools (search, get, reviews) — **no Playwright**.
- origin after redirects: `https://www.anthropologie.com`
- Beacon note: **common = bazaarvoice** only. bazaarvoice `clientName: Anthropologie`, `locale: en_US`; tools getProductReviews / getReviewSummary / getProductQuestions (`askAndAnswer: true`). **custom: []** — do not invent algolia/constructor/sfcc commons for URBN BFF. Beacon Builder should later add a custom bundle for catalog-search-service + catalog pools + help HTML.
- Intended custom tool names (for Beacon Builder; not in beacon custom[]):
  - `searchProducts` → `POST /api/catalog-search-service/v0/an-us/products/searches` body `{query}`
  - `getSearchSuggestions` → `GET|POST …/products/sayt/`
  - `getProduct` → `GET /api/catalog/v0/an-us/pools/US_DIRECT/products?slug={slug}` or `product-id=`
  - `browseCategory` → `GET /api/catalog/v0/an-us/navigation?categoryId=` + category PLP
  - `searchPolicies` → HTML `/help/returns-exchanges`, `/help/shipping-info`, `/help/faq`, `/help/online-returns` (needs browser/DataDome pass)
- bazaarvoice: clientName **`Anthropologie`** (api-config; deployments/anthropologie/main_site/production/en_US); displaycode **5310-en_us**; locale **en_US**; productId = `AN-{style}-{suffix}` (e.g. AN-4113086690011-000)
- urbn siteId: **`an-us`**; inventoryPool **`US_DIRECT`**
- sibling: Urban Outfitters BV **`UrbanOutfitters`** / displayCode **5309** — out of scope for this domain key
- published discovery notes:
  - Prefer **BV products+reviews** for demo from datacenter egress; upgrade to a15 catalog-search-service when DataDome clears
  - Chrome UA + Sec-CH + `--compressed` still **403** on first-party APIs (unlike adidas Glass)
  - robots (Wayback 2024-01): Disallow `/api/`, `/orchestration/`; Sitemap `sitemapindex.xml` (live 200)
  - Image CDN: `https://images.urbndata.com/is/image/Anthropologie/{style}_{color}_b`
  - llms.txt is a live category/content map (useful for collections without HTML)
- do not do next: Playwright HAR (already ≥3 shopper tools); optional later only if live help SSR, cart headers, or priced search BFF required
- discovered_at: 2026-09-04T07:50:00-05:00
- files:
  - `/workspace/anthropologie.com.manifest.json`
  - `/workspace/anthropologie.com.report.md`
  - `/workspace/anthropologie.com.beacon-manifest.json`
