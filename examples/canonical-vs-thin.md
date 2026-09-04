# Canonical vs thin — Vuori vs Nordstrom

One page for CX audit microsite contrast. **Same product (Gladly Chat SDK + Beacon)**; different bound contracts. Do not present both as “full Gladly.”

| | **Canonical (thick)** | **Thin (honest demo_ready)** |
|---|---|---|
| Store | Vuori (`vuoriclothing.com`) | Nordstrom (`nordstrom.com`) |
| Quality label | `strong` / Path A commons | `thin_html` (+ BV reviews only) |
| Platform | Shopify headless Next | Custom React + Akamai a32 |
| Beacon commons | Algolia + Shopify + Shopify Storefront + Yotpo (Nate gold sample) | Bazaarvoice only (`clientName: nordstrom`) |
| Custom bundle | none needed | `[]` — held until search unblocks |
| Keyword search | **yes** — Algolia `us_products` | **no** — `/api/search/*` 403 a32 |
| PDP | Algolia hit / Storefront / JSON | HTML JSON-LD only (`/s/{slug}/{id}`) |
| Reviews | Yotpo (loyalty live; reviews API flaky) | BV tools live; Conversations passkey unpublished |
| Policies | Shopify MCP `search_shop_policies_and_faqs` on **checkout** host | Help HTML `/browse/services/return-policy` **high** |
| Cart / checkout | Discovery bound Shopify Ajax cart; **do not** claim `showCheckout` unless `core.config.checkout` | **not bound** |
| MCP | checkout `/api/mcp` live | missing |
| Wall | none for catalog | `akamai_a32` + Imperva HTML |

## Sidekick script (same beats, different truth)

**Shopper:** “Find me stretch jeans under $180, what do people think, and what’s the return window?”

**Vuori (canonical)**
1. `algolia.searchProducts` (or search_catalog) → titled hits with price + rating  
2. Open a PDP via `core.navigateToUrl`  
3. Reviews if Yotpo hydrates; else say ratings came from search  
4. Policies via Shopify MCP / help  
5. Cart: guide to on-page Add to Bag (`findElements` → highlight/click). Honest if Ajax cart is bound vs not in this Beacon.

**Nordstrom (thin)**
1. **Cannot keyword-search.** Ask for a product URL or browse a collection (`/browse/women` PLP anchors).  
2. `get_product` from JSON-LD on a known PDP (e.g. AG Brinley 8566706, $164.50, 4.4/8).  
3. `bazaarvoice.getReviewSummary` / `getProductReviews` with `productId=<styleId>` (not a Nordstrom SKU guess).  
4. `search_policies` on `/browse/services/return-policy`.  
5. No bag. Never invent `/api/search` success.

If the microsite only has 8 seconds: **Vuori answers the whole question from tools; Nordstrom answers PDP + policy and admits search is blocked.**

## What to show visually

- Vuori: tool chips for search → product → policy (thick associate).  
- Nordstrom: tool chips for PDP JSON-LD + BV + policy; a **struck-through** search chip labeled `akamai_a32`.  
- Caption both `demo_ready: yes` — then the quality label. That is the point.

## Files

- Vuori discovery: `/workspace/vuori.clothing.manifest.json` · replication `/workspace/vuori-api-replication.md`  
- Vuori-class Beacon gold (Nate): `beacon-manifest-33fefd9c-9784-44f5-855e-403918689a2e.json`  
- Loadable Path A Beacon on disk (Constructor + BV, no custom): `/workspace/jcrew.com.beacon-manifest.json` — use if you need a file the widget can ingest today  
- Nordstrom: `/workspace/nordstrom.com.beacon-manifest.json` · `.manifest.json` · `.report.md`  
- Labels / fork rules: `/workspace/manifest-builder-operating.md`

## Do not

- Put Nordstrom next to Vuori as “same Gladly coverage.”  
- Show Nordstrom keyword search, cart, or a fake `nordstrom-commerce` common.  
- Use Gladly-canonical names (`search_catalog`) in widget copy — Chat SDK names only (`algolia.*`, `bazaarvoice.*`, `core.*`).
