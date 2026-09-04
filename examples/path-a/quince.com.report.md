# quince.com

- platform: next_headless (Next.js Pages `gssp`, CloudFront; commerce APIs on Lastbrand/SAND `*.onequince.com`)
- platform host: api.onequince.com (Kong/ALB also on api.quince.com; public BFF/cart on api-prod-public.onequince.com). Apex quince.com 301 → https://www.quince.com. shop.quince.com 404. developer./docs. do not resolve. No `*.myshopify.com`.
- mcp: missing (`POST /api/mcp`, `/api/ucp/mcp`, `/mcp` on www and api.quince.com all 404 HTML/plain; `/.well-known/mcp.json`, `mcp/server-card.json`, `ucp`, `ai`, `ai-plugin.json`, `api-catalog`, `integrations.json`, `oauth-authorization-server`, `/llms.txt`, `/llms-full.txt`, `/agents.md` 404)
- webmcp: unknown (no `/.webmcp/bridge.js`, no webmcp string in homepage HTML)
- public rest bound:
  - Algolia `quince_product_color_index_v1` POST query — 200, 1336 hits for `cashmere` (search-only key from homepage `__NEXT_DATA__`)
  - Algolia facets — 200, departments/categories for 16844 color rows
  - `GET https://api-prod-public.onequince.com/bff-service/v1/product/get-product-cards?productIds=76` — 200 JSON product card
  - `GET https://api.onequince.com/sand-services/collection/v3?page=0&limit=5&collectionId=2nCWEduqgXsYAjVn1Z7mqJ&pageType=GROUPED` — 200, 4746 products in Women
  - `GET https://api.onequince.com/search-service/search/suggestions/v2?query=cashmere` — 200 `{suggestedList}`
  - `GET https://quince.us-1.gladly.com/api/v1/orgs/Bq5O4FGeR6CHGQtaizG6gA/answers` — 200, 189 help articles
  - `GET /cart-service/carts/active` — 401 (path real, session required)
  - PDP JSON-LD `@graph` Product / Offer / MerchantReturnPolicy / FAQPage on 3 sitemap PDPs
  - Shop JSON-LD CollectionPage + ItemList on `/shop/women`
  - Policy HTML 200: `/faq`, `/shipping-returns` (`/returns` redirects), `/terms`, `/privacy-policy`, `/shipping`, `/how-it-works`
  - Sitemaps 200: `/sitemap.xml` → `/sitemap_us.xml` → `sitemap_pdps.xml` (5059), `sitemap_shop.xml` (538), `sitemap_subcollections.xml` (1183), `sitemap_misc.xml` (102)
- tools bound:
  - search_catalog ← rest:algolia (high)
  - get_product ← rest:bff-service (high)
  - list_collections ← rest:algolia_facets (high)
  - get_cart ← rest:cart-service (medium, auth: session)
  - update_cart ← js:cart-service (medium, not write-probed)
  - search_policies ← rest:gladly_help_center (high)
- gaps:
  - lookup_order — needs_auth (no public guest order JSON; order-service paths 404 without customer token)
  - create_return — needs_auth (return-management-service not public)
- demo_ready: yes
- why: `search_catalog` and `get_product` bind at high on live JSON (Algolia + BFF product cards). `search_policies` binds at high on the public Gladly Help Center answers API plus HTML `/faq` and `/shipping-returns`. Cart exists but is session-gated (401). No MCP/WebMCP. Six shopper tools, two auth gaps.
- do not do next: click-tour unless you need a hydrated cart payload or Find-My-Order; JS extract and published APIs already cover catalog, PDP, collections, and policies. Do not bind checkout/complete or analytics beacons. Do not claim order lookup from the homepage.

## Probe notes

- Fingerprint: `__NEXT_DATA__`, `/prod/_next/static`, `NEXT_PREFERRED_LOCALE`, CloudFront. `mage-` hits were image filenames, not Magento.
- Shopify pack (`/products.json`, `/cart.js`, `/collections.json`) 404 HTML — not Shopify Liquid.
- GraphQL introspection closed on `/graphql` and `/api/graphql`.
- integrations.sh detect: empty.
- Step 6 browser sniff skipped (more than 3 usable shopper tools after steps 1–5).
- No write probes (`POST /carts/{id}/add-item` documented from JS + 403 on GET sibling only).
