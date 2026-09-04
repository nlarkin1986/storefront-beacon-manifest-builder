# Path B matrix

Updated: 2026-09-04T12:49:08Z (UTC) — **discovery complete (10/10)**

## Batch rollup

- demo_ready: **10/10**
- custom bundles ready: `gap.com`, `oldnavy.gap.com`, `nike.com`, `adidas.com`, `uniqlo.com`
- commons-only (no custom): `jcrew.com`
- custom held (bot wall / session): `nordstrom.com`, `macys.com`, `lululemon.com`, `anthropologie.com`

### Custom artifact paths

- gap.com → `/workspace/gap-integration/`
- oldnavy.gap.com → `/workspace/oldnavy-integration/`
- nike.com → `/workspace/nike-integration/`
- adidas.com → `/workspace/adidas-integration/` (egress caveat)
- uniqlo.com → `/workspace/uniqlo-integration/` (live)

| domain | platform_guess | mcp | commons_bound | custom_needed | demo_ready | triage | gaps | probe_paths | elapsed_notes | pack_holes |
|---|---|---|---|---|---|---|---|---|---|---|
| `gap.com` | gap_custom_next + Apigee (api.gap.com); legacy SFCC .do URLs | missing (POST /api/mcp,/api/ucp/mcp,/mcp → 503; /.well-known/mcp.json → 404) | yes | yes | yes | needs_custom_bff | get_cart/update_cart needs OAuth on commerce/shopping-bags; lookup_order/create_return needs_auth; Bloomreach dxpapi keys not in static JS | /workspace/gap.com.manifest.json; /workspace/gap.com.beacon-manifest.json; /workspace/gap.com.report.md; /workspace/gap-integration/ | drift-check 2026-09-04: www.gap.com 200; /.well-known/mcp.json 404; POST /api/mcp 302 empty; api.gap.com search brand=gap still binds (jeans→products). brand=gp invalid. | Apigee ProductSearch REST pattern (commerce/search/products/v2/cc); Gap onesite Next MFE + SFCC legacy URLs; BV styleId vs full cc pid |
| `oldnavy.gap.com` | gap_custom_next / api.gap.com (mybrand=on); Gap Inc onesite sibling | missing (302 store-closed) | yes | yes | yes | demo_ready_commons + needs_custom_bff (fork gap-integration brand override, not new BFF) | cart/order/return needs_auth (shopping-bags OAuth, same as gap); policies path differs: /customerService/info.do?cid= vs gap /customer-service/* | /workspace/oldnavy.gap.com.manifest.json; /workspace/oldnavy.gap.com.beacon-manifest.json; /workspace/oldnavy.gap.com.report.md; /workspace/oldnavy-integration/ | Manifest Builder HTTP-only ~6min after request; brand=on search + brand=ON catalog; BV clientName old-navy; Beacon Builder fork smoke-passed (search on / getProduct ON / browse / returns 82724) | Gap family brand param matrix (gap/on/br) on shared Apigee; Brand-override fork pattern for gap-integration (not new common); Old Navy policy URL shape /customerService/info.do?cid=; BV clientName per brand (old-navy) without passkey; Proven: gap-integration brand-override fork works for Gap Inc siblings |
| `nordstrom.com` | nordstrom_custom_react (not SFCC/Shopify) | missing | yes | yes | yes | demo_ready_commons (thin) — hold full custom until Akamai search unblocks | search_catalog blocked (Akamai a32 on /api/search/* + /api/style/*); REST PDP 403; cart + order/return needs_auth; BV clientName nordstrom — no Conversations passkey in ManifestConfig | /workspace/nordstrom.com.manifest.json; /workspace/nordstrom.com.beacon-manifest.json; /workspace/nordstrom.com.report.md | HTTP-only: get_product JSON-LD + policies high; list_collections html medium; keyword search blocked | Akamai sensor / bot headers for enterprise search APIs; HTML JSON-LD get_product pack when REST PDP blocked; Thin demo_ready pattern (policies + PDP only) |
| `macys.com` | macys_custom_xapi (WSSG v4 + xapi); Akamai BVM on www + api.macys.com | missing | yes | yes | yes | demo_ready_commons (workaround) — hold xapi custom until Akamai bypass | www + api.macys.com Akamai BVM hard-403 from box; WSSG/xapi need client-id + session; BV catalog: identity+ratings only (no price/inventory); cart/order needs_auth | /workspace/macys.com.manifest.json; /workspace/macys.com.beacon-manifest.json; /workspace/macys.com.report.md | Catalog via BV products Search/Id (medium); Help Center policies high; native BFF blocked | BV Conversations products API as bot-wall workaround (no prices); Akamai BVM hard-403 on enterprise www + api hosts; WSSG/xapi client-id + session pack (deferred) |
| `nike.com` | nike_custom_nextjs; public api.nike.com product_feed | missing | yes | yes | yes | demo_ready_commons (strong) + needs_custom product_feed — queue Beacon Builder | cart/order needs_auth; cic/browse 404; Googlebot UA hits Akamai 403 — use Chrome UA; TurnTo productId = styleCode not styleColor | /workspace/nike.com.manifest.json; /workspace/nike.com.beacon-manifest.json; /workspace/nike.com.report.md; /workspace/nike-integration/ | product_feed/threads/v2 search+PDP high; Help cmsPost policies; TurnTo reviews; custom queued; Beacon Builder smoke PASSED (search/getProduct/browse/returns/TurnTo styleCode) | Nike product_feed/threads/v2 pattern (public catalog spine); TurnTo over BV (siteKey common; Conversations-style hydrate limited); UA pack: Chrome not Googlebot for Nike |
| `adidas.com` | adidas_glass_next; sitePath=us; Glass content-engine + search product APIs | missing | yes | yes | yes | demo_ready_commons (strong catalog) + needs_custom Glass APIs — queue after Nike | cart needs_auth; BV passkey unpublished; bare UA/Googlebot Akamai 403 — need Chrome+Sec-CH; live help HTML 403; policies medium via Wayback-validated; live Glass APIs 403 from Beacon Builder egress — re-smoke from residential/Chrome+Sec-CH when possible | /workspace/adidas.com.manifest.json; /workspace/adidas.com.beacon-manifest.json; /workspace/adidas.com.report.md; /workspace/adidas-integration/ | Glass APIs high at discovery; Beacon smoke PASSED on fixtures+Wayback — live Glass 403 from builder egress (Akamai); bundle/BV OK; no cart | Adidas Glass /api/plp/content-engine + /api/search/product/{id}; Sec-CH-UA / Chrome client hints required; Policies may need browser pass when help HTML 403; Egress variance: discovery bind vs builder smoke 403 on same Glass endpoints |
| `lululemon.com` | lululemon_upper_funnel_next; origin shop.lululemon.com; SNB/CNE GraphQL GE401001 | missing | yes | yes | yes | demo_ready_commons (mixed) — hold GraphQL custom until session; BV search fallback | first-party GraphQL /snb|/cne/graphql GE401001 bot wall; cart/order Okta auth; BV search medium (no native keyword when GraphQL blocked) | /workspace/lululemon.com.manifest.json; /workspace/lululemon.com.beacon-manifest.json; /workspace/lululemon.com.report.md | BV search medium; PDP/category SSR high; Help Contentful high; GraphQL custom deferred | Lululemon SNB/CNE GraphQL GE401001 upper-funnel wall; BV-as-search fallback (same pattern as Macy’s) |
| `jcrew.com` | jcrew_next_constructor; first-party Akamai 403; SFCC residual do not bind | missing | yes | no | yes | demo_ready_commons — Constructor.io + BV; no custom for catalog demo | full first-party Akamai 403; policies medium (Wayback); Factory = separate Constructor key; confirm serviceUrl/section vs chat-sdk ConstructorioManifestConfig (may keep key only) | /workspace/jcrew.com.manifest.json; /workspace/jcrew.com.beacon-manifest.json; /workspace/jcrew.com.report.md | Constructor search/get/browse/suggestions high; BV high; Path B storefront with Path A beacon | Path B site can still be Path A beacon when search vendor is public (Constructor); Constructor key + optional serviceUrl/section validation against ManifestConfig |
| `uniqlo.com` | uniqlo_fr_spa_commerce_v5; x-fr-clientid: uq.us.web-spa | missing | no | yes | yes | demo_ready + needs_custom high — pure Path B (common=[]); queue Beacon Builder | HTML mostly 403; no Algolia/Constructor/BV commons; policies medium | /workspace/uniqlo.com.manifest.json; /workspace/uniqlo.com.beacon-manifest.json; /workspace/uniqlo.com.report.md; /workspace/uniqlo-integration/ | FR commerce v5 live smoke PASSED (6 custom tools, common=[]); faq-us 403 → SPA i18n policies; no cart | Fast Retailing commerce v5 + x-fr-clientid header pattern; Pure Path B beacon (common=[]) — catalog entirely custom |
| `anthropologie.com` | urbn_a15_spa; first-party DataDome 403; a15Client catalog-search-service deferred | missing | yes | yes | yes | demo_ready_commons (BV catalog) — hold a15 custom until DataDome session | first-party DataDome 403; a15Client catalog-search-service needed for prices/inventory; policies medium (Wayback) | /workspace/anthropologie.com.manifest.json; /workspace/anthropologie.com.beacon-manifest.json; /workspace/anthropologie.com.report.md | BV products catalog high; llms.txt 200 (rare); a15 custom deferred; batch #10 final | URBN a15 + DataDome; BV-as-catalog (same family as Macy’s); llms.txt present — rare positive discovery signal |

## Pack holes (cross-run learnings)

1. **Apigee / Gap ProductSearch** — shared `api.gap.com` with `brand=` (`gap` / `on` / catalog `ON`); fork pattern proven via `oldnavy-integration`
2. **Nike product_feed** — public `api.nike.com/product_feed/threads/v2` + TurnTo styleCode (not BV)
3. **Adidas Glass** — `/api/plp/content-engine` + Sec-CH; egress variance (discovery bind vs builder 403)
4. **Fast Retailing commerce v5** — Uniqlo pure Path B (`common=[]`) + `x-fr-clientid`
5. **Constructor on Path B** — J.Crew first-party 403 but Constructor.io commons = Path A–style beacon
6. **BV-as-catalog / search fallback** — Macy’s, Lululemon, Anthropologie when BFF/DataDome/GraphQL walled (identity+ratings; often no price)
7. **Bot walls** — Akamai a32 (Nordstrom), BVM (Macy’s), GE401001 GraphQL (Lululemon), DataDome (URBN a15)
8. **llms.txt** — Anthropologie 200 (rare positive); Gap/others often SPA HTML noise

## Do not promise

- 10 full Gap twins — only Gap family + Nike + Uniqlo (+ Adidas caveat) have customs
- Fake carts / showCheckout
- Beacon custom for Nordstrom/Macy’s/Lululemon/Anthro until session/sensor capture

