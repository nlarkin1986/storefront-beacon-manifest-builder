# lululemon.com

- platform: **lululemon_upper_funnel_next** (Next.js upper-funnel appshell + MFE search/pdp/cdp under `/static/uf/*`; Akamai; first-party GraphQL `/snb/graphql` + `/cne/graphql` + `/api/graphql`; Contentful help; Bazaarvoice reviews). Not Shopify. SFCC Sites-* remnants for AU/DE/KR/UK only.
- platform host: `shop.lululemon.com` (www.lululemon.com → shop; APIs intended `shop.lululemon.com/snb|cne/graphql`; media `images.lululemon.com`; `api.lululemon.com` Akamai 403)
- mcp: **missing** (well-known/MCP/OpenAPI → 403; `/api/graphql` 200 but non-catalog Phoenix schema; robots+sitemap 200 with Chrome UA)
- webmcp: unknown
- public rest bound: **partial** — BV Conversations products/reviews live; Help + PDP/PLP SSR live with Chrome+Sec-CH (intermittent GE401001); SNB/CNE GraphQL **GE401001**
- tools bound:
  1. `search_catalog` — BV `products.json?search={q}` — **medium** (align → 1089; Id/Name/Description/ProductPageUrl; no price)
  2. `get_product` — html:`/p/{slug}/{productId}` `__NEXT_DATA__` pdp + JSON-LD ProductGroup — **high** (ila31cji15 Polartec → $138, 24 SKUs, 4 colors)
  3. `list_collections` — html:`/c/{slug}/{hash}` catalogPageData — **high** (women-hoodies n1jux6 → 69 / 40 tiles with listPrice)
  4. `search_policies` — html:`/help/{topic}` Contentful story — **high** (30-day free returns; US ship tiers; intl $30)
- gaps:
  - `/snb/graphql` SearchQuery + `/cne/graphql` GetPdpDataById/CategoryPageDataQuery → **GE401001**
  - `/api/graphql` — wrong schema for catalog (Cannot query field search/productDetailPage)
  - cart/checkout — not bound; **no showCheckout**
  - order lookup / start return — **needs_auth** (Okta)
  - BV Conversations — passkey in display bvapi.js (**not** ManifestConfig); productId = reviewsId/bazaarVoiceID
  - No Algolia / Constructor / Bloomreach / TurnTo live keys
  - HTML routes degrade to GE401001 under bot pressure
- demo_ready: **yes**
- why: `get_product` (high) via PDP SSR **and** `search_policies` (high) from Help Contentful; plus BV `search_catalog` (medium) and category `list_collections` (high). Enough for Sidekick product + policy Q without Playwright (≥3 shopper tools).
- origin after redirects: `https://shop.lululemon.com` (`www.lululemon.com` → shop)
- Beacon note: **common = bazaarvoice only** (`clientName: Lululemon`, `locale: en_US`, `bfdToken: 7834,main_site,en_US`; **no passkey**). **custom: []** — do not invent commons for upper-funnel GraphQL BFF. Beacon Builder should later add a custom bundle for searchProducts/getProduct/browseCategory/searchPolicies once SNB/CNE sessions work.
- Intended custom tool names (for Beacon Builder; not in beacon custom[]):
  - `searchProducts` → `POST /snb/graphql` SearchQuery `search(terms:)`
  - `getProduct` → `POST /cne/graphql` GetPdpDataById `productDetailPage(id:)` or HTML `/p/...`
  - `browseCategory` → `POST /cne/graphql` CategoryPageDataQuery or HTML `/c/{slug}/{hash}`
  - `searchPolicies` → HTML `/help/...` Contentful story
- bazaarvoice: clientName **`Lululemon`** (deployments/`lululemon`; displayCode **7834**); locale **en_US**; productId = reviewsId (Define_Jacket → **10364** reviews @ **4.50**)
- published discovery notes:
  - Prefer **Chrome UA + Sec-CH-UA + Sec-Fetch document + `--compressed`**; Googlebot/mobile → Access Denied
  - GraphQL catalog lives on **/snb/graphql** and **/cne/graphql**, not `/api/graphql`
  - robots Disallow `*/search?Ntt=*` and `/api/c/*`; Sitemap `https://shop.lululemon.com/sitemap.xml` (Category/Product/Help/Store/Story)
  - No Algolia keys in SSR configs (search-app uses Fusion/SNB GraphQL)
- do not do next: Playwright HAR unless demo needs live SNB keyword JSON (already ≥3 shopper tools); optional later to capture Akamai sensor for `/snb/graphql`
- discovered_at: 2026-09-04T07:05:00-05:00
- files:
  - `/workspace/lululemon.com.manifest.json`
  - `/workspace/lululemon.com.report.md`
  - `/workspace/lululemon.com.beacon-manifest.json`
