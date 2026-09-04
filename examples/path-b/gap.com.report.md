# gap.com

- platform: gap_custom_next (Gap Inc onesite Next.js MFE; legacy SFCC `.do` URLs in sitemaps/robots)
- platform host: api.gap.com (Apigee; also catalog aliases under same host)
- mcp: **missing** (`POST /api/mcp`, `/api/ucp/mcp`, `/mcp` → 503; `/.well-known/mcp.json` → 404)
- webmcp: unknown (no `/.webmcp/bridge.js` check required; no live `/mcp`)
- public rest bound: yes — catalog search + product STYLE/cards on `api.gap.com`
- tools bound:
  1. `search_catalog` — rest:`/commerce/search/products/v2/cc` — **high**
  2. `get_product` — rest:`/catalog_products/v3/products` (+ cards / omni aliases; BV reviews enrichment) — **high**
  3. `list_collections` — rest:`/commerce/search/products/v2/cc?cid=` + `native-division-sitemap.xml` — **high**
  4. `search_policies` — html:`/customer-service/*` (returns, shipping, FAQs) — **high**
- gaps:
  - `get_cart` / `update_cart` — `commerce/shopping-bags` needs OAuth (`401 Invalid access token`); no write probes
  - `lookup_order` / `create_return` — needs_auth (Gladly Lookup Adaptor / App Platform)
  - Bloomreach dxpapi keys not in static JS (search covered by ProductSearch REST)
- demo_ready: **yes**
- why: `search_catalog` and `search_policies` both bind at high confidence from live HTTP; `get_product` also high. Enough for Sidekick product Q + policy answers without cart.
- origin after redirects: `https://www.gap.com` (gap.com → www)
- siblings: gapfactory live (separate brand); api.gap.com live Apigee; shop.gap.com TLS fail; catalog AKS hosts not publicly resolvable
- published discovery notes:
  - `/llms.txt` and `/llms-full.txt` return SPA homepage HTML (not an llms manifest)
  - robots lists `native-sitemap.xml` + `shop/native-custom-sitemap.xml` (product/category/division indexes live)
- do not do next: click-thru HAR unless cart OAuth session is required for a demo; optional one sniff only to capture Bloomreach `account_id`/`auth_key` if ProductSearch REST ever regresses
- discovered_at: 2026-09-03T20:45:00-05:00
- files:
  - `/workspace/gap.com.manifest.json`
  - `/workspace/gap.com.report.md`
