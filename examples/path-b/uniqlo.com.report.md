# uniqlo.com

- platform: **uniqlo_fr_spa_commerce_v5** (Fast Retailing custom React SPA + Akamai; first-party `/us/api/commerce/v5/en/products` search/PDP/reviews/stock). Not Shopify. Not Algolia. Not Constructor.
- platform host: `www.uniqlo.com` (region `/us/en`; images `image.uniqlo.com`; CMS `im.uniqlo.com`; FAQ `faq-us.uniqlo.com`; returns `returns.narvar.com/uniqlo/returns`)
- mcp: **missing** (well-known/MCP/OpenAPI/graphql → 403/404; robots **200**; US sitemap **200**)
- webmcp: unknown
- public rest bound: **yes** — commerce v5 JSON live with Chrome UA + compressed (+ `x-fr-clientid: uq.us.web-spa`); most HTML 403
- tools bound:
  1. `search_catalog` — `GET /us/api/commerce/v5/en/products?q={q}` — **high** (jeans → 71; airism → 58; sweater → 73)
  2. `get_product` — `GET /us/api/commerce/v5/en/products/{productId}` — **high** (E465185-000 AIRism → $24.9, rating 4.8/4761, 128 l2s)
  3. `list_collections` — `GET .../products?path={genderId}` — **high** (Women 22210 → 771; Men 22211 → 633; flagCodes=discount → 259)
  4. `get_reviews` — `GET .../products/{id}/reviews` — **high** (E465185-000 → 4761 reviews; bvId present but FR-hosted)
  5. `get_inventory` — `GET .../products/{id}/price-groups/{pg}/stock` — **high** (128 variant rows)
  6. `search_policies` — faq-us URL patterns + SPA i18n — **medium** (live FAQ **403**; i18n: 30-day returns, customer-paid return ship unless UNIQLO error; FREE shipping $99+ / free pickup)
- gaps:
  - Homepage/PDP/PLP/help/membership HTML Akamai-walled
  - faq-us.uniqlo.com Salesforce KB 403 from this egress
  - No Algolia keys; BV deployments/uniqlo* **404** — **do not bind algolia/bazaarvoice commons**
  - `categoryIds=` leaf ids unreliable (Jeans 23339 → mixed 1326 feed) — prefer `path=`
  - No autocomplete endpoint
  - cart/checkout — not bound; **no showCheckout**
- demo_ready: **yes**
- why: `search_catalog`/`get_product` (high) via public FR commerce v5 **and** `search_policies` (medium) via FAQ URL map + SPA i18n. ≥3 shopper tools — **no Playwright**.
- origin after redirects: `https://www.uniqlo.com` (normalize `/us` → `/us/en` SPA)
- Beacon note: **common = []** (no registry vendor with VALID ManifestConfig). **custom: []** — do not invent commons for FR BFF. Beacon Builder should later add a custom bundle for commerce tools.
- Intended custom tool names (for Beacon Builder; not in beacon custom[]):
  - `searchProducts` → `GET /us/api/commerce/v5/en/products?q={q}&offset=&limit=`
  - `getProduct` → `GET /us/api/commerce/v5/en/products/{productId}`
  - `browseCategory` → `GET .../products?path={categoryId}` (gender L1) or `flagCodes=discount`
  - `getProductReviews` → `GET .../products/{productId}/reviews`
  - `getProductStock` → `GET .../products/{productId}/price-groups/{priceGroup}/stock`
  - `searchPolicies` → HTML `https://faq-us.uniqlo.com/articles/en_US/FAQ/{slug}/` (needs browser/Akamai pass) + Narvar returns portal
- client_id: **`uq.us.web-spa`** (SPA `clientID`; header `x-fr-clientid`)
- published discovery notes:
  - Prefer **Chrome UA + Sec-CH + `--compressed` + Origin/Referer**; optional `x-fr-clientid: uq.us.web-spa`
  - Commerce APIs succeed where HTML 403s (unlike jcrew where only third-party APIs lived)
  - PDP URL: `/us/en/products/{productId}/{priceGroup}`
  - robots Disallow storefront search query URLs and cart; API paths not listed
  - Sitemap: `https://www.uniqlo.com/us/sitemap_us-en.xml` (~5945 locs)
- do not do next: Playwright HAR (already ≥3 shopper tools); optional later only if live faq-us SSR or cart sensor headers required
- discovered_at: 2026-09-04T07:40:00-05:00
- files:
  - `/workspace/uniqlo.com.manifest.json`
  - `/workspace/uniqlo.com.report.md`
  - `/workspace/uniqlo.com.beacon-manifest.json`
