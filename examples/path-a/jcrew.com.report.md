# jcrew.com

- platform: **jcrew_next_constructor** (custom Next.js + Builder.io CMS/help; Akamai edge; Constructor.io catalog; Bazaarvoice reviews; residual SFCC/OCAPI flags without live siteId). Not Shopify. Not Algolia.
- platform host: `www.jcrew.com` (images `s7-img-facade`; OCAPI host `ocapi.jcrew.com`; services `services.jcrew.com/jc/prod/xanadu` 403)
- mcp: **missing** (well-known/MCP/OpenAPI/graphql/robots live → Akamai **403**; robots+sitemap recovered via Wayback)
- webmcp: unknown
- public rest bound: **yes** — Constructor.io `ac.cnstrc.com` + Bazaarvoice Conversations live without storefront cookies; first-party www/m/factory/services HTML+JSON **403** even with Chrome UA + Sec-CH + compressed
- tools bound:
  1. `search_catalog` — `GET https://ac.cnstrc.com/search/{q}?key=key_GZ67TnLoJ8IV4vZ2` — **high** (sweater → 373; cashmere → 144)
  2. `get_product` — same search endpoint with style id — **high** (CX415 → $98, orderable, stockLevel 679)
  3. `list_collections` — `GET .../browse/group_id/{id}` — **high** (womens~categories~clothing~sweaters → 187; womens → 2161)
  4. `get_search_suggestions` — autocomplete — **high** (cash → cashmere*)
  5. `get_reviews` — BV reviews.json client **JCrew** / displaycode **1706-en_us** — **high** (CX415 → 2517 reviews)
  6. `search_policies` — html:`/help/{topic}` Builder helpPage — **medium** (live **403**; Wayback 2025-01: 30-day returns, $7.50 prepaid label, free same-style exchanges; Standard ship $7 / 3–6 days; Rewards free standard shipping)
- gaps:
  - Entire first-party origin Akamai-walled from this egress (homepage, PDP `/p/{id}`, help, robots, CMS JSON, xanadu)
  - SFCC OCAPI `SiteNotFoundException` for probed siteIds; Demandware.store CDX empty since 2024 — **do not bind `sfcc` common**
  - Constructor `browse/item_id/{id}` returned 0 for CX415 — use search-by-id for get_product
  - Constructor `url` field points at `ocapi.jcrew.com/{variation_id}.html` (not shopper PDP); real PDP = `/p/{productId}` per sitemap-wex
  - cart/checkout — not bound; **no showCheckout**
  - Stylitics flags on but account/bundle unpublished — skip stylitics common
  - Dynamic Yield id present but `enableDynamicYield=false`
  - BV passkeys in SSR config — **not** ManifestConfig fields (omit)
- demo_ready: **yes**
- why: `search_catalog`/`get_product` (high) via public Constructor.io **and** `search_policies` (medium) via help URL patterns + Wayback-validated content. ≥3 shopper tools (search, get, browse, suggestions, reviews) — **no Playwright**.
- origin after redirects: `https://www.jcrew.com` (apex/factory also Akamai 403 here)
- Beacon note: **common = constructorio + bazaarvoice** only. constructorio `key: key_GZ67TnLoJ8IV4vZ2`, `serviceUrl: https://ac.cnstrc.com`, `section: Products`; tools searchProducts / getSearchSuggestions / browseProducts (**no** getRecommendations — pods unknown). bazaarvoice `clientName: JCrew`, `locale: en_US`; tools getProductReviews / getReviewSummary / getProductQuestions (`askAndAnswer: true`). **custom: []** — do not invent sfcc/algolia commons. Factory sibling is a separate index/BV client.
- Intended custom tool names (for Beacon Builder; not in beacon custom[]):
  - `searchPolicies` → HTML `/help/returns-exchanges`, `/help/shipping-handling`, … (needs browser/Akamai pass or cached Builder blocks)
  - optional later: `getProductHtml` → `/p/{productId}` if SSR JSON-LD needed beyond Constructor fields
  - optional later: xanadu/OCAPI BFF if `services.jcrew.com` or real OCAPI siteId becomes reachable
- bazaarvoice: clientName **`JCrew`** (api-config; deployments/jcrew/main_site/production/en_US); displaycode **1706-en_us**; locale **en_US**; productId = style id (CX415)
- constructorio: index key **`key_GZ67TnLoJ8IV4vZ2`** (SSR `constructorAPIKey`; cust js `jcrew_OWQq7B.js`)
- factory sibling: `factory.jcrew.com` — Constructor **`key_nu9b76kKatVvDK9C`** (sweater → 99); BV **`jcrewfactory`** — out of scope for this domain key
- published discovery notes:
  - Prefer **third-party Constructor + BV** for demo; do not depend on www.jcrew.com HTML from datacenter egress
  - Chrome UA + Sec-CH + `--compressed` still **403** on first-party (unlike adidas Glass APIs)
  - robots (Wayback 2024-01): Disallow `/api/`, `*/search/`, checkout/account; Sitemap `https://www.jcrew.com/sitemap-wex/sitemap-index.xml`
  - Image CDN: `https://www.jcrew.com/s7-img-facade/{style}_{color}`
- do not do next: Playwright HAR (already ≥3 shopper tools); optional later only if live help SSR or cart headers required
- discovered_at: 2026-09-04T07:25:00-05:00
- files:
  - `/workspace/jcrew.com.manifest.json`
  - `/workspace/jcrew.com.report.md`
  - `/workspace/jcrew.com.beacon-manifest.json`
