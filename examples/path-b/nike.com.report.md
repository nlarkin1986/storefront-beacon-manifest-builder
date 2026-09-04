# nike.com

- platform: **nike_custom_nextjs** (Next.js SSR + unified-edge-router; Akamai edge; first-party `api.nike.com` product_feed; Help gethelpfe-webshell CMS; TurnTo reviews). Not Shopify/SFCC.
- platform host: `www.nike.com` (APIs: `api.nike.com`; media `static.nike.com`)
- mcp: **missing** (well-known/MCP/OpenAPI/graphql/llms → 404 Next HTML; robots 200 with Chrome UA)
- webmcp: unknown
- public rest bound: **yes** — `product_feed/threads/v2` searchTerms + styleColor filters live; Help `cmsPost` SSR; TurnTo cdn-ws live; Googlebot **AkamaiGHost 403**
- tools bound:
  1. `search_catalog` — `GET api.nike.com/product_feed/threads/v2?...&searchTerms={q}` — **high** (pegasus → 2828 resources; styleColor/title/price)
  2. `get_product` — product_feed `filter=productInfo.merchProduct.styleColor({id})` + PDP JSON-LD ProductGroup — **high** (CW2288-111 AF1 → $115, 22 SKUs, available)
  3. `search_policies` — html:`/help/a/{slug}` `__NEXT_DATA__` cmsPost — **high** (60-day returns/exchanges; Member free ship $50 / guest $75; US-only shipping)
  4. `list_collections` — html:`/w/{wall}` gridwall `/t/` anchors — **medium** (mens-shoes → 198 PDPs)
- gaps:
  - `cic/browse/v1` products wrapper → **404** code 310; use product_feed directly
  - cart/checkout — not bound; **no showCheckout**
  - order lookup / start return — `/orders` **needs_auth** (Member) or guest order#+email
  - Help REST `api.nike.com/content/help/v1` → Unauthorized; rely on HTML cmsPost
  - TurnTo id = **styleCode** (CW2288), not styleColor — styleColor returns empty catItem
  - Bazaarvoice — **not used** (deployments 404)
- demo_ready: **yes**
- why: `search_catalog` (high) + `get_product` (high) via public product_feed **and** `search_policies` (high) from Help CMS. TurnTo common binds ratings. Enough for Sidekick product + policy Q without Playwright.
- origin after redirects: `https://www.nike.com` (`nike.com` / `store.nike.com` → www)
- Beacon note: **common = turnto only** (`siteKey: 78GDJmj4zEDYwwHsite`, `locale: en_US`; **no BV passkey**). **custom: []** — do not invent fake commons for Nike product_feed BFF. Beacon Builder should later add a custom bundle for searchProducts/getProduct/browseCategory/searchPolicies.
- Intended custom tool names (for Beacon Builder; not in beacon custom[]):
  - `searchProducts` → `GET /product_feed/threads/v2?...&searchTerms={q}`
  - `getProduct` → `GET /product_feed/threads/v2?...&filter=productInfo.merchProduct.styleColor({styleColor})`
  - `browseCategory` → HTML `/w/{wall}` or future attribute-filtered feed
  - `searchPolicies` → HTML `/help/a/{slug}` cmsPost
- turnto: siteKey **`78GDJmj4zEDYwwHsite`** (PDP `turnToSiteKey`); summary/list via `cdn-ws.turnto.com/v5/sitedata/.../d/review/...`; CW2288 → rating **4.8**, directReviewsCount **4267**
- published discovery notes:
  - Prefer **Chrome UA + `--compressed`**; Googlebot → Akamai Access Denied on homepage/robots/API
  - Nike.com channelId `d9a5bc42-4b9c-4976-858a-f159cf99c647`; SNKRS `010794e5-35fe-4e32-aaff-cd2c74f89d61`
  - Help slug `returns-policy` works; `returns-policy-us` / `*-gs` often Article Not Found
  - robots lists help + pdp/gridwall/snkrs/article/locator sitemaps
  - No Algolia / Constructor / Bloomreach / PowerReviews / Yotpo live keys observed
- do not do next: Playwright HAR (already ≥3 shopper tools); optional later only if cic/browse session headers or cart flows needed
- discovered_at: 2026-09-04T06:50:00-05:00
- files:
  - `/workspace/nike.com.manifest.json`
  - `/workspace/nike.com.report.md`
  - `/workspace/nike.com.beacon-manifest.json`
