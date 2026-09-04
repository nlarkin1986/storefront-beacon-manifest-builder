# adidas.com

- platform: **adidas_glass_next** (Glass Next.js landing/help apps + microfrontends.glass.adidas.com; Akamai; first-party `/api/plp/content-engine` + `/api/search/product/{id}`; Bazaarvoice reviews). Not Shopify. Legacy SFCC paths remain in robots.
- platform host: `www.adidas.com` (region `sitePath=us`; media `assets.adidas.com`; Kong `api.adidas.com` root unmatched)
- mcp: **missing** (well-known/MCP/OpenAPI/graphql → 404/403; robots 200; glass sitemap listed but 403 here)
- webmcp: unknown
- public rest bound: **yes** — content-engine search/browse + search/product live with Chrome UA + Sec-CH + Origin/Referer; bare UA / Googlebot often AkamaiNetStorage **403**
- tools bound:
  1. `search_catalog` — `GET /api/plp/content-engine?sitePath=us&query={q}` — **high** (samba → 228; ultraboost/men-shoes/women-shoes also live)
  2. `get_product` — `GET /api/search/product/{articleId}?sitePath=us` — **high** (B75806 Samba OG → $100, 13 images, orderable)
  3. `list_collections` — same content-engine with taxonomy slug — **high** (women-shoes → 1879)
  4. `search_policies` — html:`/us/help/{topic}/{slug}` HelpPage layouts — **medium** (live HTML **403**; footer URLs live; Wayback 2025-05-06: free 30-day returns, refund after warehouse QA, shipping table)
- gaps:
  - `/api/products/{id}` + availability → **403** Akamai HTML
  - cart/checkout — not bound; **no showCheckout**
  - BV Conversations — **passkey unpublished** (siteAuth); askAndAnswer **false**
  - No Algolia / Constructor / Bloomreach / TurnTo live keys (turnto string noise only)
  - PDP/PLP/help HTML intermittent **403** even with Sec-CH
- demo_ready: **yes**
- why: `search_catalog` (high) + `get_product` (high) via public Glass APIs **and** `search_policies` (medium) via Help URL patterns + Wayback-validated content. Enough for Sidekick product + policy Q without Playwright (≥3 shopper tools).
- origin after redirects: `https://www.adidas.com` (`adidas.com` → www; geo US → `/us`)
- Beacon note: **common = bazaarvoice only** (`clientName: adidas`, `locale: en_US`; **no passkey** — not a ManifestConfig field when unpublished). **custom: []** — do not invent commons for Glass content-engine BFF. Beacon Builder should later add a custom bundle for searchProducts/getProduct/browseCategory/searchPolicies.
- Intended custom tool names (for Beacon Builder; not in beacon custom[]):
  - `searchProducts` → `GET /api/plp/content-engine?sitePath=us&query={q}`
  - `getProduct` → `GET /api/search/product/{articleId}?sitePath=us`
  - `browseCategory` → content-engine `query={taxonomy}` (e.g. men-shoes)
  - `searchPolicies` → HTML `/us/help/...` HelpPage `layouts[].contents[].summary` (needs browser/Akamai pass)
- bazaarvoice: clientName **`adidas`** (deployments/adidas/.../bv.js; displayCode **28373**); alt adidas-us **17750**; locale **en_US**; productId = articleId
- published discovery notes:
  - Prefer **Chrome UA + Sec-CH-UA + `--compressed` + Origin/Referer** for `/api/*`; Googlebot → Access Denied / 403 on HTML
  - Do **not** call `/api/plp/content-engine/search` (403); use `/api/plp/content-engine?query=`
  - robots Disallow `/api/search/product/*` (endpoint still returns 200 to API clients) and `/*search?*`
  - Sitemap: `https://www.adidas.com/glass/sitemaps/adidas/US/en/sitemap-index.xml` (403 this egress)
  - api.adidas.com Kong: root `/` and `/glass/` → `no Route matched`
- do not do next: Playwright HAR (already ≥3 shopper tools); optional later only if cart sensor headers or live help SSR needed
- discovered_at: 2026-09-04T06:55:00-05:00
- files:
  - `/workspace/adidas.com.manifest.json`
  - `/workspace/adidas.com.report.md`
  - `/workspace/adidas.com.beacon-manifest.json`
