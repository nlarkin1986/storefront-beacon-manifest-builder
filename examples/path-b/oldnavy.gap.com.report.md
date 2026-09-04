# oldnavy.gap.com

- platform: gap_custom_next (Gap Inc onesite Next.js MFE; sibling of gap.com; legacy SFCC `.do` + `/customerService/info.do`)
- platform host: api.gap.com (Apigee; same host as gap.com)
- brand param that worked: **search `brand=on`** (lowercase); **catalog `brand=ON`** (uppercase enum). Rejected: oldnavy / OLDNAVY / oldnavy_gap
- mcp: **missing** (`POST /api/mcp`, `/api/ucp/mcp`, `/mcp` → **302** to `/store-closed/OldNavy/storeClosed/en/index.html`; `/.well-known/mcp.json` → 404)
- webmcp: unknown (no live `/mcp`)
- public rest bound: yes — catalog search + product STYLE/cards/omni on `api.gap.com` with brand=on/ON
- tools bound:
  1. `search_catalog` — rest:`/commerce/search/products/v2/cc?brand=on` — **high** (jeans → 199 colors; sample 90's Loose Jeans / ccId 788041002)
  2. `get_product` — rest:`/catalog_products/v3/products?brand=ON` (+ cards `ON:{pid}` / omni; BV reviews enrichment clientName=old-navy) — **high**
  3. `list_collections` — rest:`/commerce/search/products/v2/cc?cid=&brand=on` + megavav shop-all cids (Women 1185233, Men 1031099, …) — **high**
  4. `search_policies` — html:`/customerService/info.do?cid=` (returns 82724, shipping 82725, CS 3171, size 83042, contact 83044) — **high**
- gaps:
  - `get_cart` / `update_cart` — `commerce/shopping-bags` needs OAuth (`401 Invalid access token`); no write probes
  - `lookup_order` / `create_return` — needs_auth (Gladly Lookup Adaptor / App Platform)
- demo_ready: **yes**
- why: `search_catalog` + `get_product` + `search_policies` bind at high confidence from live HTTP. Enough for Sidekick product Q + policy answers without cart.
- origin after redirects: `https://oldnavy.gap.com` (no forced www; header `mybrand: on`)
- Beacon note: same `api.gap.com` works with brand=on/ON — **Beacon Builder can fork the gap-integration bundle with brand override** (`brand=on` search / `brand=ON` catalog). Do not invent a separate common integration for Gap catalog.
- bazaarvoice: deployments clientName **`old-navy`** (bv.js 200); passkey present on PDP bvConfig but Beacon common config is clientName + locale only (no passkey).
- published discovery notes:
  - `/llms.txt` returns SPA homepage HTML (not an llms manifest)
  - robots lists `native-sitemap.xml` + `shop/native-custom-sitemap.xml`; `native-division-sitemap.xml` is thin vs megavav
  - Gap `/customer-service/*` paths PageNotFound on Old Navy — use `/customerService/info.do?cid=`
- do not do next: click-thru HAR unless cart OAuth session is required for a demo
- discovered_at: 2026-09-04T06:14:00-05:00
- files:
  - `/workspace/oldnavy.gap.com.manifest.json`
  - `/workspace/oldnavy.gap.com.report.md`
  - `/workspace/oldnavy.gap.com.beacon-manifest.json`
