# API-first ecommerce demo — API call reference

Internal runbook for Manifest Builder / Demo Buddy. HTTP only: `curl`, static HTML/JS GET, JSON-RPC MCP. No Playwright, no click-tour HAR.

**Generated:** 2026-09-03 (America/Chicago)  
**Proven live target:** [quince.com](https://www.quince.com) (`demo_ready: true`)  
**Registry coverage grade:** 72/100 (yes=1.0, partial=0.6, no=0 across 25 Demo Buddy integrations)

---

## Purpose

Given a storefront URL, probe **published contracts** and bind a fixed Gladly tool list:

```
manifest.candidates  +  https://acme.com  →  live bindings
```

Use the bound calls to demo ecommerce Sidekick interactions — search catalog, product detail, reviews, policies — without driving the storefront UI.

Runtime adapters that consume this contract:

- **Sidekick tools / Guides** — executor hits the bound URL for the canonical tool name
- **WebMCP / in-page agent** — same tools with shopper cookies (cart writes)
- **App Platform / Lookup Adaptor** — authenticated order / return JSON (not public homepage)

---

## Canonical Gladly tools

| Tool | Gladly use | Typical auth | API-first demo? |
|---|---|---|---|
| `search_catalog` | Sidekick product Q, Chat quick actions | none | **Yes** |
| `get_product` | PDP detail, variants, price, availability (+ reviews enrich) | none | **Yes** |
| `list_collections` | Browse / nav | none | **Yes** |
| `get_cart` | Cart state | none or session cookie | Partial (often 401) |
| `update_cart` | Add / change qty | session cookie | Demo tab / WebMCP only |
| `search_policies` | Returns, shipping, warranty | none | **Yes** |
| `lookup_order` | WISMO, order details | auth / Lookup Adaptor | **No** (mark gap) |
| `create_return` | Return / exchange | auth / App Platform | **No** (mark gap) |

Cap shopper tools at 8–12. Prefer MCP bindings over REST when both live.

---

## Demo script (API-only)

Show this sequence live with HTTP responses only:

1. **Search** — `search_catalog` with a shopper query (e.g. `cashmere`)
2. **Open a product** — `get_product` with an id/handle from step 1
3. **Reviews** — enrich from Yotpo / Bazaarvoice / PowerReviews if detected (or product payload ratings)
4. **Policy** — `search_policies` for returns / shipping

Skip cart mutate and order lookup in the first API-only pass.

### Quince example sequence (proven)

```http
POST https://K81D2WQH9L-dsn.algolia.net/1/indexes/quince_product_color_index_v1/query
X-Algolia-Application-Id: K81D2WQH9L
X-Algolia-API-Key: 3f306f13f22cfa9128f18019ba17dc34
Content-Type: application/json

{"query":"cashmere","hitsPerPage":8}
```

```http
GET https://api-prod-public.onequince.com/bff-service/v1/product/get-product-cards?productIds=76
```

```http
GET https://quince.us-1.gladly.com/api/v1/orgs/Bq5O4FGeR6CHGQtaizG6gA/answers?query=returns
```

---

## Discovery probes (pipeline, before binding)

Run against **origin + siblings** (`www.`, `shop.`, `api.`, `developer.`, `docs.`, platform host). No browser.

### Agent / MCP

```http
GET  {origin}/llms.txt
GET  {origin}/llms-full.txt
GET  {origin}/agents.md
GET  {origin}/.well-known/mcp.json
GET  {origin}/.well-known/mcp/server-card.json
GET  {origin}/.well-known/ucp
GET  {origin}/.well-known/ai
GET  {origin}/.well-known/ai-plugin.json
GET  {origin}/.well-known/api-catalog
GET  {origin}/.well-known/integrations.json
GET  {origin}/.well-known/oauth-authorization-server
POST {origin}/api/mcp
POST {origin}/api/ucp/mcp
POST {origin}/mcp
```

MCP `tools/list` body:

```json
{ "jsonrpc": "2.0", "id": "1", "method": "tools/list" }
```

MCP `tools/call` body (after bind):

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "{mcp_tool_name}",
    "arguments": { "query": "{q}" }
  }
}
```

If `POST /api/mcp` or `/api/ucp/mcp` returns tools: bind to canonical names and treat shopper-side discovery as done (unless cart vs catalog are split across the two).

### Specs

```http
GET  {origin}/openapi.json
GET  {origin}/openapi.yaml
GET  {origin}/swagger.json
GET  {origin}/swagger.yaml
GET  {origin}/api/openapi.json
GET  {origin}/v1/openapi.json
GET  {origin}/docs/openapi.json
POST {origin}/graphql
POST {origin}/api/graphql
```

### Indexes

```http
GET {origin}/robots.txt
GET {origin}/sitemap.xml
GET {origin}/sitemap_index.xml
```

Follow links inside `llms.txt`, robots, and api-catalog that look like openapi / swagger / graphql / mcp / reference / api.

Optional oracle (do not hard-depend):

```http
GET https://integrations.sh/api/{domain}/detect
```

### Shopify Liquid canned pack (when fingerprinted)

```http
POST {origin}/api/mcp
POST {origin}/api/ucp/mcp
GET  {origin}/products.json?limit=10
GET  {origin}/collections.json
GET  {origin}/collections/{handle}/products.json
GET  {origin}/products/{handle}.js
GET  {origin}/search/suggest.json?q={q}
GET  {origin}/search.json?q={q}
GET  {origin}/cart.js
# POST {origin}/cart/add.js   — demo session only, NOT discovery
GET  {origin}/llms.txt
GET  {origin}/agents.md
GET  {origin}/.well-known/ucp
```

Also try the same paths on `{shop}.myshopify.com` if resolved.

### WooCommerce canned pack

```http
GET {origin}/wp-json/
GET {origin}/wp-json/wc/store/v1/products
GET {origin}/wp-json/wc/store/v1/products?search={q}
GET {origin}/wp-json/wc/store/v1/products/categories
GET {origin}/wp-json/wc/store/v1/cart
GET {origin}/wp-json/wc/v3/products
```

### BigCommerce canned pack

```http
GET {origin}/api/storefront/products
GET {origin}/api/storefront/carts
```

---

## Quince.com — live bound calls (proven 2026-09-03)

- **domain:** `quince.com`
- **origin:** `https://www.quince.com`
- **platform:** `next_headless`
- **platform_host:** `api.onequince.com`
- **demo_ready:** `True`
- **discovered_at:** `2026-09-03T18:35:00-05:00`
- **MCP surfaces:** storefront_mcp=`missing`, ucp_mcp=`missing`, webmcp=`unknown`

Quince is Next.js headless (not Shopify). No `/api/mcp`. Catalog via Algolia; PDP via Lastbrand/SAND BFF; policies via Gladly Help Center.

### `search_catalog`

- **confidence:** `high`
- **source:** `rest:algolia`
- **auth:** `none`
- **transport:** `rest`
- **gladly_use:** Sidekick product questions. Ask for a product or category and return name, price, handle, and stock.
- **notes:** Live 200 on 2026-09-03. Query cashmere returned 1336 hits. Use quince_product_id as productIds for get_product. Search-only Algolia key is published in storefront NEXT_DATA.

**Call**

```json
{
  "method": "POST",
  "url": "https://K81D2WQH9L-dsn.algolia.net/1/indexes/quince_product_color_index_v1/query",
  "headers": {
    "Content-Type": "application/json",
    "X-Algolia-Application-Id": "K81D2WQH9L",
    "X-Algolia-API-Key": "3f306f13f22cfa9128f18019ba17dc34"
  },
  "body": {
    "query": "{q}",
    "hitsPerPage": 8
  }
}
```

**example_keys:** `hits`, `nbHits`, `product_id`, `quince_product_id`, `product_handle`, `product_title`, `description`, `min_price`, `max_price`, `in_stock`, `sizes`, `color`, `department`

### `get_product`

- **confidence:** `high`
- **source:** `rest:bff-service`
- **auth:** `none`
- **transport:** `rest`
- **gladly_use:** Look up one product for variants, colors, ratings, and the shopper URL slug.
- **notes:** Live 200 for productIds=76 (Mongolian Cashmere Crewneck Sweater). Empty data [] if the id is missing. PDP JSON-LD Product/Offer also present on https://www.quince.com/{handle}.

**Call**

```json
{
  "method": "GET",
  "url": "https://api-prod-public.onequince.com/bff-service/v1/product/get-product-cards",
  "query": {
    "productIds": "{quince_product_id}"
  }
}
```

**example_keys:** `data`, `product`, `productId`, `relatedIds`, `title`, `slug`, `reviews`, `cardVariants`, `colorVariants`, `flags`

### `list_collections`

- **confidence:** `high`
- **source:** `rest:algolia_facets`
- **auth:** `none`
- **transport:** `rest`
- **gladly_use:** Show shopper-facing departments and categories so they can browse Women, Home, Kids, Men, and finer groups like Cashmere or Bedding.
- **notes:** Live 200. 16844 indexed color rows. Collection URLs also published at https://www.quince.com/sitemap_shop.xml (538 locs). First-party browse of one collection: GET https://api.onequince.com/sand-services/collection/v3?page=0&limit=5&collectionId={contentfulCollectionId}&pageType=GROUPED (200 for 2nCWEduqgXsYAjVn1Z7mqJ / Women).

**Call**

```json
{
  "method": "POST",
  "url": "https://K81D2WQH9L-dsn.algolia.net/1/indexes/quince_product_color_index_v1/query",
  "headers": {
    "Content-Type": "application/json",
    "X-Algolia-Application-Id": "K81D2WQH9L",
    "X-Algolia-API-Key": "3f306f13f22cfa9128f18019ba17dc34"
  },
  "body": {
    "query": "",
    "hitsPerPage": 0,
    "facets": [
      "business_department",
      "department",
      "category",
      "sub_department"
    ]
  }
}
```

**example_keys:** `facets`, `category`, `department`, `sub_department`, `business_department`, `nbHits`

### `get_cart`

- **confidence:** `medium`
- **source:** `rest:cart-service`
- **auth:** `session`
- **transport:** `rest`
- **gladly_use:** Read the shopper's current cart. Needs their storefront cart session, not a public datacenter call.
- **notes:** Path is real: GET returned 401 Unauthorized with path /cart-service/carts/active. Homepage cookies (q-cookie-id, REGION_ID) were not enough. Same 401 on api.onequince.com. JS also exposes GET /carts/{cartId}.

**Call**

```json
{
  "method": "GET",
  "url": "https://api-prod-public.onequince.com/cart-service/carts/active"
}
```

**example_keys:** `timestamp`, `status`, `error`, `path`

### `update_cart`

- **confidence:** `medium`
- **source:** `js:cart-service`
- **auth:** `session`
- **transport:** `rest`
- **gladly_use:** Add or change a cart line during a live shopper session. Do not call this from a server demo without their cart cookie.
- **notes:** Not write-probed. First-party JS documents POST /carts/${cartId}/add-item plus update-item-quantity, apply-discount-code. GET /cart-service/carts/add-item returned 403 Forbidden (path exists).

**Call**

```json
{
  "method": "POST",
  "url": "https://api-prod-public.onequince.com/cart-service/carts/{cartId}/add-item",
  "body": {
    "variantId": "{variant_id}",
    "quantity": 1
  }
}
```

**example_keys:** `timestamp`, `status`, `error`, `path`

### `search_policies`

- **confidence:** `high`
- **source:** `rest:gladly_help_center`
- **auth:** `none`
- **transport:** `rest`
- **gladly_use:** Answer shipping, returns, refunds, subscriptions, and other policy questions from Quince's published Help Center articles.
- **notes:** Live 200, 189 answers including Shipping Costs, Return Instructions, Bedding Returns, Subscription Terms. Org/brand from storefront localeConfig.gladlyHelpCenter. HTML policy pages also live: /faq, /shipping-returns ( /returns redirects here), /terms, /privacy-policy, /how-it-works.

**Call**

```json
{
  "method": "GET",
  "url": "https://quince.us-1.gladly.com/api/v1/orgs/Bq5O4FGeR6CHGQtaizG6gA/answers",
  "query": {
    "query": "{q}"
  }
}
```

**example_keys:** `bodyHtml`, `id`, `language`, `name`

### Gaps

- **`lookup_order`** — `needs_auth`  
  Hint: Gladly Lookup Adaptor / Customer Account / OMS. JS exposes /v2/customer/orders/ and api-prod-public.onequince.com/order-service. Public GETs 404'd; no guest order lookup bound. Storefront has enableFindMyOrder but that is an authenticated/app flow.
- **`create_return`** — `needs_auth`  
  Hint: Gladly App Platform / return-management-service. JS mentions https://api.onequince.com/return-management-service/api/v1/external. Public GET 404. Policy articles exist; do not claim a public return-create API.

### Noise rejected (not tools)

`mixpanel-prod.onequince.com`, `statsigapi.net`, `cdn.attn.tv`, `stylitics.com`, `google-analytics.com`, `facebook pixel`, `tiktok pixel`, `criteo`, `pinterest tag`, `linkedin pixel`, `ia.quince.com`, `stream.onequince.com/ia/publish/events`, `klarna`, `yotpo`, `hubspot`

---

## Integration pack API calls (HTTP-only registry)

From Demo Buddy registry (25). Pack stubs for yes+partial = 23. Skip `stylitics` and `turnto` (no hydrate).

**Scorecard:** yes=10, partial=13, no=2

### Platforms

#### `magento`

- **http_only:** `partial` · **confidence:** `medium` · **pinned:** `False`
- **bind_to:** `search_catalog`, `get_product`, `list_collections`, `get_cart`, `update_cart`
- **hydrate_call (scorecard):** POST /graphql — guest catalog queries; REST /rest/V1/guest-carts for cart (store-dependent). Store code in path.
- **needs_from_page:** store code, form_key (cart CSRF sometimes), GraphQL endpoint path, optional integration token if published (rare)
- **detect:**
  - HTML: mage-, Magento_, form_key, /static/version, cookies: PHPSESSID + form_key, meta name generator Magento
  - GET /rest/{store}/V1/products?searchCriteria[pageSize]=1 (often 401)
  - GET /graphql with POST { products(search:"x") { items { sku name } } } — guest may work
  - Headers: X-Magento-*, set-cookie mage-cache
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "POST",
    "url_template": "{origin}/graphql",
    "headers_template": {
      "Content-Type": "application/json"
    },
    "body_template": {
      "query": "{ products(search: \"{q}\") { items { sku name url_key } } }"
    },
    "key_sources": [
      "store code",
      "form_key (cart CSRF sometimes)",
      "GraphQL endpoint path",
      "optional integration token if published (rare)"
    ]
  },
  {
    "gladly_tool": "get_product",
    "method": "POST",
    "url_template": "{origin}/graphql",
    "headers_template": {
      "Content-Type": "application/json"
    },
    "body_template": {
      "query": "{ products(search: \"{q}\") { items { sku name url_key } } }"
    },
    "key_sources": [
      "store code",
      "form_key (cart CSRF sometimes)",
      "GraphQL endpoint path",
      "optional integration token if published (rare)"
    ]
  },
  {
    "gladly_tool": "list_collections",
    "method": "POST",
    "url_template": "{origin}/graphql",
    "headers_template": {
      "Content-Type": "application/json"
    },
    "body_template": {
      "query": "{ products(search: \"{q}\") { items { sku name url_key } } }"
    },
    "key_sources": [
      "store code",
      "form_key (cart CSRF sometimes)",
      "GraphQL endpoint path",
      "optional integration token if published (rare)"
    ]
  },
  {
    "gladly_tool": "get_cart",
    "method": "POST",
    "url_template": "{origin}/graphql",
    "headers_template": {
      "Content-Type": "application/json"
    },
    "body_template": {
      "query": "{ products(search: \"{q}\") { items { sku name url_key } } }"
    },
    "key_sources": [
      "store code",
      "form_key (cart CSRF sometimes)",
      "GraphQL endpoint path",
      "optional integration token if published (rare)"
    ]
  },
  {
    "gladly_tool": "update_cart",
    "method": "POST",
    "url_template": "{origin}/graphql",
    "headers_template": {
      "Content-Type": "application/json"
    },
    "body_template": {
      "query": "{ products(search: \"{q}\") { items { sku name url_key } } }"
    },
    "key_sources": [
      "store code",
      "form_key (cart CSRF sometimes)",
      "GraphQL endpoint path",
      "optional integration token if published (rare)"
    ]
  }
]
```
- **notes:** Guest GraphQL often disabled; WAF/captcha on /rest
- **blockers:** Guest GraphQL often disabled; WAF/captcha on /rest; Cart needs quote cookie; Orders/returns need customer token

#### `sap-commerce`

- **http_only:** `partial` · **confidence:** `medium` · **pinned:** `True`
- **bind_to:** `search_catalog`, `get_product`, `list_collections`, `get_cart`, `update_cart`
- **hydrate_call (scorecard):** GET {origin}/occ/v2/{baseSiteId}/products/search?query={q}&fields=FULL — cart via /users/anonymous/carts (OCC)
- **needs_from_page:** baseSiteId, OCC base path, optional language/currency
- **detect:**
  - HTML/JS: hybris, /occ/v2/, electronics-spa, SAP Commerce, cx-storefront, baseSite
  - GET /occ/v2/{baseSiteId}/products/search?query={q} (public OCC often open for search)
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "GET",
    "url_template": "{origin}/occ/v2/{baseSiteId}/products/search?query={q}&fields=FULL",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "baseSiteId",
      "OCC base path",
      "optional language/currency"
    ]
  },
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "{origin}/occ/v2/{baseSiteId}/products/search?query={q}&fields=FULL",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "baseSiteId",
      "OCC base path",
      "optional language/currency"
    ]
  },
  {
    "gladly_tool": "list_collections",
    "method": "GET",
    "url_template": "{origin}/occ/v2/{baseSiteId}/products/search?query={q}&fields=FULL",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "baseSiteId",
      "OCC base path",
      "optional language/currency"
    ]
  },
  {
    "gladly_tool": "get_cart",
    "method": "GET",
    "url_template": "{origin}/occ/v2/{baseSiteId}/products/search?query={q}&fields=FULL",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "baseSiteId",
      "OCC base path",
      "optional language/currency"
    ]
  },
  {
    "gladly_tool": "update_cart",
    "method": "GET",
    "url_template": "{origin}/occ/v2/{baseSiteId}/products/search?query={q}&fields=FULL",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "baseSiteId",
      "OCC base path",
      "optional language/currency"
    ]
  }
]
```
- **notes:** OCC may require client credentials on B2B; WAF
- **blockers:** OCC may require client credentials on B2B; WAF; Assisted-service / SSO for orders

#### `sfcc`

- **http_only:** `partial` · **confidence:** `medium` · **pinned:** `True`
- **bind_to:** `search_catalog`, `get_product`, `list_collections`, `get_cart`, `update_cart`
- **hydrate_call (scorecard):** GET https://{host}/s/{siteId}/dw/shop/v23_2/product_search?q={q}&client_id={client_id} — cart /baskets with guest JWT (site-dependent)
- **needs_from_page:** siteId, OCAPI client_id (often in JS), host / realm
- **detect:**
  - HTML/JS: demandware, salesforce commerce, __SYSTEMDIR, /on/demandware.store/, dw.ac.js, SFRA
  - Cookies: dwsid, dwsecuretoken
  - OCAPI paths /s/-/dw/shop/v*/ /s/-/dw/data/
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "GET",
    "url_template": "https://{host}/s/{siteId}/dw/shop/{apiVersion}/product_search?q={q}&client_id={clientId}",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "siteId",
      "OCAPI client_id (often in JS)",
      "host / realm"
    ]
  },
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "https://{host}/s/{siteId}/dw/shop/{apiVersion}/product_search?q={q}&client_id={clientId}",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "siteId",
      "OCAPI client_id (often in JS)",
      "host / realm"
    ]
  },
  {
    "gladly_tool": "list_collections",
    "method": "GET",
    "url_template": "https://{host}/s/{siteId}/dw/shop/{apiVersion}/product_search?q={q}&client_id={clientId}",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "siteId",
      "OCAPI client_id (often in JS)",
      "host / realm"
    ]
  },
  {
    "gladly_tool": "get_cart",
    "method": "GET",
    "url_template": "https://{host}/s/{siteId}/dw/shop/{apiVersion}/product_search?q={q}&client_id={clientId}",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "siteId",
      "OCAPI client_id (often in JS)",
      "host / realm"
    ]
  },
  {
    "gladly_tool": "update_cart",
    "method": "GET",
    "url_template": "https://{host}/s/{siteId}/dw/shop/{apiVersion}/product_search?q={q}&client_id={clientId}",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "siteId",
      "OCAPI client_id (often in JS)",
      "host / realm"
    ]
  }
]
```
- **notes:** client_id may be restricted by allowlist IP; Shop API versions vary
- **blockers:** client_id may be restricted by allowlist IP; Shop API versions vary; Orders need auth

#### `shopify`

- **http_only:** `yes` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `search_catalog`, `get_product`, `list_collections`, `get_cart`, `update_cart`
- **hydrate_call (scorecard):** GET /products.json?limit=10&q={q} (or /search/suggest.json); GET /products/{handle}.js; GET /collections.json; GET/POST /cart.js /cart/add.js
- **needs_from_page:** shop domain, optional theme product handles from HTML
- **detect:**
  - HTML: Shopify.shop, CDN.shopify.com, /cdn/shop/, myshopify.com, window.Shopify
  - GET /products.json, /collections.json, /cart.js — classic Liquid storefront signals
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "GET",
    "url_template": "{origin}/products.json?limit=20",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "shop domain",
      "optional theme product handles from HTML"
    ]
  },
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "{origin}/products/{handle}.js",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "shop domain",
      "optional theme product handles from HTML"
    ]
  },
  {
    "gladly_tool": "list_collections",
    "method": "GET",
    "url_template": "{origin}/collections.json?limit=50",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "shop domain",
      "optional theme product handles from HTML"
    ]
  },
  {
    "gladly_tool": "get_cart",
    "method": "GET",
    "url_template": "{origin}/cart.js",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "shop domain",
      "optional theme product handles from HTML"
    ]
  },
  {
    "gladly_tool": "update_cart",
    "method": "POST",
    "url_template": "{origin}/cart/add.js",
    "headers_template": {
      "Content-Type": "application/json"
    },
    "body_template": {
      "items": [
        {
          "id": "{variantId}",
          "quantity": 1
        }
      ]
    },
    "key_sources": [
      "shop domain",
      "optional theme product handles from HTML"
    ]
  }
]
```
- **notes:** products.json may be disabled/rate-limited; Checkout/order lookup needs auth
- **blockers:** products.json may be disabled/rate-limited; Checkout/order lookup needs auth; Headless may lack Liquid JSON — use shopify-storefront pack

#### `shopify-storefront`

- **http_only:** `yes` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `search_catalog`, `get_product`, `list_collections`, `get_cart`, `update_cart`
- **hydrate_call (scorecard):** POST https://{shop}/api/{version}/graphql.json — header X-Shopify-Storefront-Access-Token: {publicToken}; products/query, cartCreate/cartLinesAdd
- **needs_from_page:** storefront public access token, API version, shop domain
- **detect:**
  - HTML/JS: Storefront API token (StorefrontPublicToken / shpat_ vs storefront public), /api/2024-*/graphql.json
  - POST /api/mcp or Shopify MCP / Storefront MCP surfaces
  - X-Shopify-Storefront-Access-Token in JS bundles
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "POST",
    "url_template": "https://{shopDomain}/api/{apiVersion}/graphql.json",
    "headers_template": {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": "{storefrontPublicToken}"
    },
    "body_template": {
      "query": "{graphQLQuery}",
      "variables": {}
    },
    "key_sources": [
      "storefront public access token",
      "API version",
      "shop domain"
    ]
  },
  {
    "gladly_tool": "get_product",
    "method": "POST",
    "url_template": "https://{shopDomain}/api/{apiVersion}/graphql.json",
    "headers_template": {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": "{storefrontPublicToken}"
    },
    "body_template": {
      "query": "{graphQLQuery}",
      "variables": {}
    },
    "key_sources": [
      "storefront public access token",
      "API version",
      "shop domain"
    ]
  },
  {
    "gladly_tool": "list_collections",
    "method": "POST",
    "url_template": "https://{shopDomain}/api/{apiVersion}/graphql.json",
    "headers_template": {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": "{storefrontPublicToken}"
    },
    "body_template": {
      "query": "{graphQLQuery}",
      "variables": {}
    },
    "key_sources": [
      "storefront public access token",
      "API version",
      "shop domain"
    ]
  },
  {
    "gladly_tool": "get_cart",
    "method": "POST",
    "url_template": "https://{shopDomain}/api/{apiVersion}/graphql.json",
    "headers_template": {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": "{storefrontPublicToken}"
    },
    "body_template": {
      "query": "{graphQLQuery}",
      "variables": {}
    },
    "key_sources": [
      "storefront public access token",
      "API version",
      "shop domain"
    ]
  },
  {
    "gladly_tool": "update_cart",
    "method": "POST",
    "url_template": "https://{shopDomain}/api/{apiVersion}/graphql.json",
    "headers_template": {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": "{storefrontPublicToken}"
    },
    "body_template": {
      "query": "{graphQLQuery}",
      "variables": {}
    },
    "key_sources": [
      "storefront public access token",
      "API version",
      "shop domain"
    ]
  }
]
```
- **notes:** Token must be storefront-public not Admin; MCP may be absent
- **blockers:** Token must be storefront-public not Admin; MCP may be absent; Customer account APIs for orders

### Search

#### `algolia`

- **http_only:** `yes` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `search_catalog`, `list_collections`
- **hydrate_call (scorecard):** POST https://{appId}-dsn.algolia.net/1/indexes/{indexName}/query — headers X-Algolia-Application-Id, X-Algolia-API-Key; body {"query":"{q}","hitsPerPage":8}. Facets query with hitsPerPage:0 for list_collections.
- **needs_from_page:** appId / Application-Id, search-only apiKey (not admin), indexName(s)
- **detect:**
  - GET homepage HTML/JS: regex algolia|algolianet\.com|search-client|aa\(|autocomplete\.js
  - Extract X-Algolia-Application-Id / appId and search-only apiKey from inline config, __NEXT_DATA__, window.algolia, or bundled JS
  - Optional GET https://{appId}-dsn.algolia.net/1/indexes/*/settings with search key (expect 403/200 shape confirms host)
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "POST",
    "url_template": "https://{appId}-dsn.algolia.net/1/indexes/{indexName}/query",
    "headers_template": {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": "{appId}",
      "X-Algolia-API-Key": "{searchApiKey}"
    },
    "body_template": {
      "query": "{q}",
      "hitsPerPage": 8
    },
    "key_sources": [
      "appId / Application-Id",
      "search-only apiKey (not admin)",
      "indexName(s)"
    ]
  },
  {
    "gladly_tool": "list_collections",
    "method": "POST",
    "url_template": "https://{appId}-dsn.algolia.net/1/indexes/{indexName}/query",
    "headers_template": {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": "{appId}",
      "X-Algolia-API-Key": "{searchApiKey}"
    },
    "body_template": {
      "query": "",
      "hitsPerPage": 0,
      "facets": [
        "*"
      ]
    },
    "key_sources": [
      "appId / Application-Id",
      "search-only apiKey (not admin)",
      "indexName(s)"
    ]
  }
]
```
- **notes:** Quince proved 2026-09-03: search-only key in __NEXT_DATA__, live 200 on product color index.
- **blockers:** Admin keys must not be used; Some sites proxy Algolia (still HTTP); Index naming varies

#### `boost`

- **http_only:** `yes` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `search_catalog`, `list_collections`
- **hydrate_call (scorecard):** GET https://services.mybcapps.com/bc-sf-filter/search?shop={shop}.myshopify.com&q={q}&event_type=init — shop domain required; usually no separate app key
- **needs_from_page:** Shopify shop domain (*.myshopify.com or Shopify.shop), optional boost config locale/currency
- **detect:**
  - HTML/JS: boostcommerce, mybcapps.com, bc-sf-filter, boost-sd, window.boostAPIConfig / boostPFS
  - Shopify theme assets: boost-pfs / boost-sd scripts
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "GET",
    "url_template": "https://services.mybcapps.com/bc-sf-filter/search?shop={shopDomain}&q={q}&event_type=init",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "Shopify shop domain (*.myshopify.com or Shopify.shop)",
      "optional boost config locale/currency"
    ]
  },
  {
    "gladly_tool": "list_collections",
    "method": "GET",
    "url_template": "https://services.mybcapps.com/bc-sf-filter/search?shop={shopDomain}&q={q}&event_type=init",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "Shopify shop domain (*.myshopify.com or Shopify.shop)",
      "optional boost config locale/currency"
    ]
  }
]
```
- **notes:** Boost AI Search & Discovery public filter/search API documented at services.mybcapps.com.
- **blockers:** Primarily Shopify; Some Turbo/tenant endpoints differ (speculative for newer hosts)

#### `constructorio`

- **http_only:** `yes` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `search_catalog`, `list_collections`
- **hydrate_call (scorecard):** GET https://ac.cnstrc.com/search/{urlencoded_q}?key={apiKey}&num_results_per_page=8 — also /autocomplete/{q} and /browse/...
- **needs_from_page:** Constructor apiKey (public search key), optional clientId/sessionId for personalization
- **detect:**
  - HTML/JS: cnstrc.com, ac.cnstrc.com, constructor.io, ConstructorioClient, apiKey: 'key_...'
  - Download first-party/bundled JS and regex apiKey|key_[a-zA-Z0-9]+
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "GET",
    "url_template": "https://ac.cnstrc.com/search/{q}?key={apiKey}&num_results_per_page=8",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "Constructor apiKey (public search key)",
      "optional clientId/sessionId for personalization"
    ]
  },
  {
    "gladly_tool": "list_collections",
    "method": "GET",
    "url_template": "https://ac.cnstrc.com/search/{q}?key={apiKey}&num_results_per_page=8",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "Constructor apiKey (public search key)",
      "optional clientId/sessionId for personalization"
    ]
  }
]
```
- **notes:** Catalog write token must stay server-side; Index/section names vary
- **blockers:** Catalog write token must stay server-side; Index/section names vary

#### `searchspring`

- **http_only:** `yes` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `search_catalog`, `list_collections`
- **hydrate_call (scorecard):** GET https://{siteId}.a.searchspring.io/api/search/search.json?siteId={siteId}&q={q}&resultsFormat=native
- **needs_from_page:** siteId
- **detect:**
  - HTML/JS: searchspring, a.searchspring.io, searchspringNet, siteId (6-char), ssUserId cookies
  - Script URLs containing searchspring.io or searchspringcdn
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "GET",
    "url_template": "https://{siteId}.a.searchspring.io/api/search/search.json?siteId={siteId}&q={q}&resultsFormat=native",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "siteId"
    ]
  },
  {
    "gladly_tool": "list_collections",
    "method": "GET",
    "url_template": "https://{siteId}.a.searchspring.io/api/search/search.json?siteId={siteId}&q={q}&resultsFormat=native",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "siteId"
    ]
  }
]
```
- **notes:** Tracking UUIDs optional for basic search; Content siteId may differ
- **blockers:** Tracking UUIDs optional for basic search; Content siteId may differ

#### `unbxd`

- **http_only:** `yes` · **confidence:** `medium` · **pinned:** `False`
- **bind_to:** `search_catalog`
- **hydrate_call (scorecard):** GET https://search.unbxd.io/{siteName}/{APIKey}/search?q={q}&rows=8 (classic public search URL pattern from Unbxd JS SDK docs)
- **needs_from_page:** siteName, APIKey (search)
- **detect:**
  - HTML/JS: unbxd, Unbxd.setSearch, UnbxdAnalyticsConf, siteName + APIKey in search config
  - Hosts: search.unbxd.io / *.unbxdapi.com patterns in JS
- **pack candidates:**

```json
[
  {
    "gladly_tool": "search_catalog",
    "method": "GET",
    "url_template": "https://search.unbxd.io/{siteName}/{APIKey}/search?q={q}&rows=8",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "siteName",
      "APIKey (search)"
    ]
  }
]
```
- **notes:** Endpoint host versions differ (legacy vs Netcore Unbxd); Pinned F but HTTP-only still feasible
- **blockers:** Endpoint host versions differ (legacy vs Netcore Unbxd); Pinned F but HTTP-only still feasible

### Reviews (enrich `get_product`)

#### `bazaarvoice`

- **http_only:** `partial` · **confidence:** `medium` · **pinned:** `True`
- **bind_to:** `get_product`
- **hydrate_call (scorecard):** GET https://api.bazaarvoice.com/data/reviews.json?apiversion=5.4&passkey={passkey}&Filter=ProductId:{productId}&Include=Products&Stats=Reviews (display/read passkey only)
- **needs_from_page:** passkey (display), clientName / deploymentZone (optional), productId mapping
- **detect:**
  - HTML/JS: bazaarvoice.com, bv.js, BV.configure, bvapi.js, reviews.bazaarvoice.com
  - Regex passkey|apiKey|clientName|deploymentZone in BV config or script query params
- **pack candidates:**

```json
[
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "https://api.bazaarvoice.com/data/reviews.json?apiversion=5.4&passkey={passkey}&Filter=ProductId:{productId}&Stats=Reviews",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "passkey (display)",
      "clientName / deploymentZone (optional)",
      "productId mapping"
    ]
  }
]
```
- **notes:** Submission APIs need different keys; Passkey may be environment-scoped
- **blockers:** Submission APIs need different keys; Passkey may be environment-scoped; Not a separate Gladly tool — enrich get_product

#### `klaviyo-reviews`

- **http_only:** `partial` · **confidence:** `low` · **pinned:** `False`
- **bind_to:** `get_product`
- **hydrate_call (scorecard):** SPECULATIVE: public storefront review widgets often load via Klaviyo CDN with company_id; official Reviews API typically needs private key — prefer scrape widget JSON if exposed, else detect-only enrich.
- **needs_from_page:** company_id / public token, product id mapping
- **detect:**
  - HTML/JS: klaviyo.com/reviews, static.klaviyo.com, klaviyo reviews widget, data-klaviyo-*, company_id / public API key PK_
  - Distinguish from Klaviyo email/onsite (same company id often)
- **pack candidates:**

```json
[
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "SPECULATIVE://klaviyo reviews CDN/company_id={companyId}/product={productId}",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "company_id / public token",
      "product id mapping"
    ]
  }
]
```
- **notes:** Many review endpoints require private API keys; Pinned generation F — lower priority pack
- **blockers:** Many review endpoints require private API keys; Pinned generation F — lower priority pack

#### `okendo`

- **http_only:** `partial` · **confidence:** `medium` · **pinned:** `False`
- **bind_to:** `get_product`
- **hydrate_call (scorecard):** SPECULATIVE: GET https://api.okendo.io/v1/stores/{subscriberId}/products/shopify-{productId}/reviews (patterns seen in headless docs; confirm per site)
- **needs_from_page:** subscriberId, Shopify product id
- **detect:**
  - HTML/JS: okendo.io, okendo-reviews, data-oke-*, subscriberId / okendo subscriber
  - Shopify app liquid snippets mentioning Okendo
- **pack candidates:**

```json
[
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "https://api.okendo.io/v1/stores/{subscriberId}/products/shopify-{productId}/reviews",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "subscriberId",
      "Shopify product id"
    ],
    "notes_speculative": true
  }
]
```
- **notes:** API shape/version varies; Pinned F
- **blockers:** API shape/version varies; Pinned F; Enrich only

#### `powerreviews`

- **http_only:** `partial` · **confidence:** `medium` · **pinned:** `True`
- **bind_to:** `get_product`
- **hydrate_call (scorecard):** GET https://readservices-b2c.powerreviews.com/m/{merchantId}/l/{locale}/product/{pageId}/reviews?apikey={apikey}
- **needs_from_page:** merchantId, apikey (Read Services), pageId / product id, locale
- **detect:**
  - HTML/JS: powerreviews.com, pwr.js, POWER_REVIEWS, readservices-b2c.powerreviews.com, merchant_id / api_key in config
- **pack candidates:**

```json
[
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "https://readservices-b2c.powerreviews.com/m/{merchantId}/l/{locale}/product/{pageId}/reviews?apikey={apikey}",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "merchantId",
      "apikey (Read Services)",
      "pageId / product id",
      "locale"
    ]
  }
]
```
- **notes:** Write/Enterprise APIs need OAuth secrets; Enrich get_product only
- **blockers:** Write/Enterprise APIs need OAuth secrets; Enrich get_product only

#### `reviewsio`

- **http_only:** `partial` · **confidence:** `medium` · **pinned:** `True`
- **bind_to:** `get_product`
- **hydrate_call (scorecard):** SPECULATIVE: widget/API hosts under widget.reviews.io or api.reviews.io with store name / API key scraped from widget embed
- **needs_from_page:** store name / store id, optional widget API key
- **detect:**
  - HTML/JS: reviews.io, widget.reviews.io, data-store-name, reviewsio
- **pack candidates:**

```json
[
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "SPECULATIVE://widget.reviews.io/... store={storeName} product={sku}",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "store name / store id",
      "optional widget API key"
    ]
  }
]
```
- **notes:** Official API often needs dashboard API key not always in page; Enrich only
- **blockers:** Official API often needs dashboard API key not always in page; Enrich only

#### `trustpilot`

- **http_only:** `partial` · **confidence:** `low` · **pinned:** `False`
- **bind_to:** `get_product`
- **hydrate_call (scorecard):** Public TrustBox widgets embed businessUnitId; official Consumer API needs API key. SPECULATIVE: limited public widget data endpoints — treat as detect + optional stars from HTML microdata.
- **needs_from_page:** businessUnitId, locale
- **detect:**
  - HTML/JS: trustpilot.com, widget.trustpilot.com, data-businessunit-id, Trustbox
- **pack candidates:**

```json
[
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "SPECULATIVE://widget data businessUnitId={businessUnitId}",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "businessUnitId",
      "locale"
    ]
  }
]
```
- **notes:** Full review API requires Trustpilot API keys; Product-SKU mapping inconsistent
- **blockers:** Full review API requires Trustpilot API keys; Product-SKU mapping inconsistent; Pinned F

#### `yotpo`

- **http_only:** `partial` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `get_product`
- **hydrate_call (scorecard):** GET https://api-cdn.yotpo.com/v1/widget/{app_key}/products/{product_id}/reviews.json
- **needs_from_page:** app_key / store_id, platform product_id
- **detect:**
  - HTML/JS: yotpo.com, staticw2.yotpo.com, yotpo-widget, appkey / data-appkey, api-cdn.yotpo.com
- **pack candidates:**

```json
[
  {
    "gladly_tool": "get_product",
    "method": "GET",
    "url_template": "https://api-cdn.yotpo.com/v1/widget/{app_key}/products/{product_id}/reviews.json",
    "headers_template": {},
    "body_template": null,
    "key_sources": [
      "app_key / store_id",
      "platform product_id"
    ]
  }
]
```
- **notes:** Write/admin APIs need secret+OAuth; Enrich get_product only
- **blockers:** Write/admin APIs need secret+OAuth; Enrich get_product only

### CRM / personalization (detect-only)

#### `chilipiper`

- **http_only:** `yes` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `detect-only / not a shopper tool`
- **hydrate_call (scorecard):** None
- **needs_from_page:** domain/subdomain for ChiliPiper tenant (optional fingerprint only)
- **detect:**
  - HTML/JS: chilipiper.com, js.chilipiper.com, ChiliPiper, concierge.js, scheduling widget iframes
  - GET paths mentioning /concierge/ or lead-form embeds
- **notes:** Detect-only CRM/scheduling fingerprint; do not bind to search_catalog.
- **blockers:** No catalog/cart/order API for Gladly shopper tools; Scheduling is sales/CS routing noise for trial catalog packs

#### `dynamicyield`

- **http_only:** `yes` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `detect-only / not a shopper tool`
- **hydrate_call (scorecard):** None
- **needs_from_page:** sectionId / experience IDs (fingerprint)
- **detect:**
  - HTML/JS: dynamicyield.com, cdn.dynamicyield.com, DY.recommendation, dyid, dyn_*, script src with //cdn.dynamicyield.com/api/{sectionId}/
- **notes:** Personalization APIs are not Gladly catalog tools; Recommendation feeds are site-specific and often sessionized
- **blockers:** Personalization APIs are not Gladly catalog tools; Recommendation feeds are site-specific and often sessionized

#### `marketo`

- **http_only:** `yes` · **confidence:** `high` · **pinned:** `True`
- **bind_to:** `detect-only / not a shopper tool`
- **hydrate_call (scorecard):** None
- **needs_from_page:** Munchkin account id
- **detect:**
  - HTML/JS: marketo.com, munchkin.js, Munchkin.init, //munchkin.marketo.net, forms2.min.js, data-marketo
- **notes:** Lead-gen only; no shopper catalog tools
- **blockers:** Lead-gen only; no shopper catalog tools

### Store locator (detect-only)

#### `stockist`

- **http_only:** `partial` · **confidence:** `medium` · **pinned:** `True`
- **bind_to:** `detect-only / not a shopper tool`
- **hydrate_call (scorecard):** SPECULATIVE community pattern: GET https://stockist.co/api/v1/{accountId}/locations/all (or similar) after scraping account id from data-stockist-widget-tag — verify per install; not a Gladly canonical tool
- **needs_from_page:** account id from data-stockist-widget-tag
- **detect:**
  - HTML: data-stockist-widget-tag, stockist.co/embed/v1/widget.min.js
  - Account id in data-stockist-widget-tag attribute
- **notes:** Not a Gladly shopper tool (no search_catalog); Unofficial location JSON patterns — label speculative
- **blockers:** Not a Gladly shopper tool (no search_catalog); Unofficial location JSON patterns — label speculative; Map provider keys irrelevant

#### `sweetiq`

- **http_only:** `partial` · **confidence:** `low` · **pinned:** `True`
- **bind_to:** `detect-only / not a shopper tool`
- **hydrate_call (scorecard):** Dashboard/location APIs generally need API keys not published on storefront (api.sweetiq.com style) — detect-only unless a public locator JSON is linked from the widget (site-specific, speculative).
- **needs_from_page:** client/widget ids if embedded
- **detect:**
  - HTML/JS: sweetiq.com, sweetiq, uberall (SweetIQ lineage), location widget scripts
- **notes:** Store locator ≠ Gladly canonical tools; Most APIs authenticated
- **blockers:** Store locator ≠ Gladly canonical tools; Most APIs authenticated; Brand may have migrated to Uberall

### Other

#### `servicify`

- **http_only:** `partial` · **confidence:** `medium` · **pinned:** `True`
- **bind_to:** `detect-only / not a shopper tool`
- **hydrate_call (scorecard):** SPECULATIVE Enterprise REST (per-shop keys, OpenAPI) for slots/bookings — NOT in Gladly canonical shopper tools; do not bind search_catalog.
- **needs_from_page:** widget/shop identifiers if present
- **detect:**
  - HTML/JS: servicify, getservicify.com, easy appointment booking, EasyAppointmentBooking, Shopify app block booking
  - Scripts/apps mentioning Servicify / Easy Appointment Booking widgets
- **notes:** Servicify ≈ Easy Appointment Booking (Shopify). Detect-only for Manifest Builder trial tools.
- **blockers:** Public API is plan-gated / invite; Appointments ≠ Gladly catalog tools; Renamed to Easy Appointment Booking

### No pack (HTTP-only dead ends)

| name | reason |
|---|---|
| `stylitics` | Visual outfit widget only — noise for Gladly trial tools |
| `turnto` | Conversations/TurnTo API requires authKey (client_secret) + OAuth — not scrapable safely |

---

## Shopify MCP name → canonical map

When `tools/list` works on Shopify Liquid / Storefront MCP:

| MCP / WebMCP name | Canonical |
|---|---|
| `search_shop_catalog` / `search_catalog` | `search_catalog` |
| `get_product` / `get_product_details` / `lookup_catalog` | `get_product` |
| `browse_store` | `list_collections` |
| `get_cart` | `get_cart` |
| `update_cart` | `update_cart` |
| `search_shop_policies_and_faqs` | `search_policies` |
| `proceed_to_checkout` | do **not** bind for trial writes; handoff only |

---

## Result classes

| HTTP / body | Store as |
|---|---|
| 2xx + expected JSON | `bound` |
| 2xx + HTML / empty | `reject` |
| 401 / 403 | `auth_required` if path looks real |
| 404 | try next candidate |
| timeout / challenge | optional one sniff for that call only (last resort) |

Confidence:

- **high** — MCP `tools/list` or hydrated platform pack with expected JSON
- **medium** — REST/JSON-LD works, shape inferred; or session-gated path proven with 401
- **low** — JS extract or single sniff, unproven schema

`demo_ready: yes` when at least `search_catalog` **or** `get_product` **and** `search_policies` (or MCP policy tool) bind at high/medium.

---

## What not to call

- Click through the store as primary discovery
- `POST /cart/add.js` (or Quince `add-item`) during discovery — demo session only
- Checkout / `complete_checkout` / charge endpoints
- Admin GraphQL or payment-complete as shopper tools
- Analytics / ads / chat beacons as tools (Segment, GA, Attentive, Mixpanel, …)
- Claim `lookup_order` works from a public homepage
- Dump 80 raw routes — emit ≤12 canonical tools
- Re-derive the Shopify pack from scratch each run

---

## Coverage grade

| Metric | Value |
|---|---|
| Registry size | 25 |
| http_only yes | 10 |
| http_only partial | 13 |
| http_only no | 2 (`stylitics`, `turnto`) |
| Grade | **72 / 100** |
| Rubric | yes=1.0, partial=0.6, no=0 |

Shopper-tool hydrate over HTTP without browser (solid): `shopify`, `shopify-storefront`, `algolia`, `boost`, `constructorio`, `searchspring`, `unbxd`.

Detect-only yes (not catalog tools): `chilipiper`, `dynamicyield`, `marketo`.

---

## Related files

| File | Role |
|---|---|
| `quince.com.manifest.json` | Bound Gladly tools for Quince |
| `quince.com.report.md` | Quince probe report |
| `demo-buddy-http-only-scorecard.md` | Per-integration feasibility |
| `demo-buddy-http-only-scorecard.json` | Machine-readable scorecard |
| `manifest-packs/*.json` | Detector + candidate stubs (23) |

---

## Suggested run prompt

```
Read retailer-endpoint-manifest-grokbot.md.
Target URL: {PASTE}
Run the pipeline. Do not click the UI unless step 6 is required.
Write {domain}.manifest.json and {domain}.report.md.
Prefer MCP bindings over REST.
Mark auth gaps instead of guessing OMS routes.
Use manifest-packs/ for integration hydrate candidates.
```
