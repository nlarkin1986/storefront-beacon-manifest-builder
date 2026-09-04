# Manifest Builder hardening — learnings from Path B batch (10)

**Batch:** gap, oldnavy, nordstrom, macys, nike, adidas, lululemon, jcrew, uniqlo, anthropologie  
**Plus priors:** quince, vuori  
**Source matrix:** `/workspace/path-b-batch/matrix.md`  
**Date:** 2026-09-04

Goal: make URL → beacon **more robust** from what actually happened — not theory.

---

## 1. Scoreboard (what “robust” must survive)

| Outcome | Count | Examples |
|---|---|---|
| Strong public BFF | 4 | Gap/ON Apigee, Nike product_feed, Adidas Glass, Uniqlo FR v5 |
| Commons save a walled site | 1 | J.Crew Constructor + BV |
| BV-as-catalog workaround | 3 | Macy’s, Lululemon (search), Anthropologie |
| Thin HTML-only | 1 | Nordstrom (JSON-LD + policies) |
| MCP live | **0/10** | Never count on MCP for Path B |
| demo_ready | **10/10** | Bar is achievable; quality varies |

**Takeaway:** Robust ≠ always rich catalog. Robust = correct triage + correct beacon shape + honest confidence + next action.

---

## 2. Pipeline changes (implement these)

### 2.1 UA / client-hint strategy (critical)

| Site behavior | What worked |
|---|---|
| Nike, Adidas, Lulu HTML | Chrome UA + `--compressed`; often **Sec-CH-UA** |
| Nike Googlebot | Hard Akamai 403 — **never lead with Googlebot** for Path B |
| Nordstrom SSR | Googlebot sometimes better for JSON-LD; search still a32 |
| Macy’s / Anthro / J.Crew first-party | Bot Manager / DataDome — don’t burn budget retrying forever |

**Hardening rule:**
1. Probe with **Chrome desktop + Accept-Encoding gzip + Origin/Referer** first.  
2. Parallel one Googlebot attempt only for HTML/JSON-LD.  
3. Cap retries at 2 UAs × 1 retry. Classify wall type: `akamai_a32` | `akamai_bvm` | `datadome` | `ge401001` | `imperva`.

### 2.2 Early fork: commons vs BFF vs wall

After homepage + one JS scan (~3–5s):

```
if Constructor/Algolia/Searchspring keys → hydrate commons FIRST (J.Crew path)
else if public BFF candidates 200 → bind BFF (Nike/Adidas/Uniqlo/Gap)
else if BV Conversations live → BV-as-catalog fallback (Macy’s/Anthro)
else if JSON-LD Product + policy HTML → thin demo_ready (Nordstrom)
else → blocked_waf / QUEUE
```

Stop spending time on SFCC OCAPI when SiteNotFound (J.Crew). Don’t invent SFCC/Algolia commons from string noise.

### 2.3 BV-as-catalog pack (new)

When first-party search 403s but BV `products.json` works:

| Bind | Confidence | Caveat |
|---|---|---|
| search_catalog | medium | no price |
| get_product | medium/high | identity + ratings + PDP URL |
| get_reviews | high | |
| search_policies | separate | |

Beacon: `common: bazaarvoice` with `clientName` (+ optional `bfdToken`/`locale`) — **never passkey**.  
Report must say: “prices need custom BFF after session.”

### 2.4 Brand-family fork detection (Gap)

Same host `api.gap.com` + `mybrand` / brand param:

| Brand | search | catalog |
|---|---|---|
| Gap | `brand=gap` | `brand=GAP` |
| Old Navy | `brand=on` | `brand=ON` |

If fingerprint matches onesite + api.gap.com → emit beacon BV per brand + **custom: []** with report note: fork `gap-integration` brand override — don’t new BFF.

### 2.5 Policy binding honesty

| Grade | When |
|---|---|
| high | Live help HTML 200 with extractable text |
| medium | URL map + Wayback / i18n strings only (Adidas, J.Crew, Uniqlo, Anthro) |
| low | Footer links only |

demo_ready can still be yes if catalog is high — but report **must** flag policy confidence for Sidekick grounding risk.

### 2.6 MCP expectation

Path B batch: **0/10 MCP**.  
Quince/Vuori: MCP rare/absent except Shopify checkout hosts.  

Rule: try MCP once in parallel; on 404/503/302 store-closed → mark missing and continue. Don’t block.

### 2.7 llms.txt

Anthropologie: real 200. Gap/others: SPA HTML false positive.  

Rule: accept only if content-type/text looks like llms (links to md/api), not homepage HTML.

### 2.8 Egress variance (Adidas lesson)

Discovery bound Glass APIs; Beacon Builder smoke later 403 from different egress.  

Rule: stamp every bind with `probed_from` + UA + required headers. Smoke must use same header recipe. Report `egress_fragile: true` when Sec-CH/sensor required.

### 2.9 Constructor / search-vendor commons

J.Crew: full first-party 403, Constructor still Path A–quality beacon.  

Rule: scan JS for `key_…` Constructor / Algolia appId **before** giving up on catalog. Validate config against ManifestConfig (`key` required; strip illegal `serviceUrl` if validator rejects).

### 2.10 TurnTo vs BV

Nike: TurnTo `siteKey`, productId = **styleCode** not styleColor. BV absent.  

Rule: detect TurnTo; don’t force BV. Document id mapping in discovery.notes.

### 2.11 demo_ready rubric (tighten)

Keep:
`(search_catalog OR get_product) AND search_policies` at ≥ medium.

Add labels:
- `demo_ready_quality`: `strong` | `commons` | `bv_fallback` | `thin_html`
- `needs_custom`: `none` | `fork` | `new_bff` | `held_bot_wall`

So Scout/product don’t treat Nordstrom thin the same as Nike strong.

---

## 3. Beacon emit checklist (every run)

1. `version` `1.0` + RFC3339 `generatedAt`  
2. `common[]` names ∈ registry only  
3. Config keys ⊆ ManifestConfig (no passkey, no shopify storeDomain, yotpo=`appKey`)  
4. Tools: only `name|description|inputSchema|annotations|outputSchema`  
5. No `showCheckout` without `core.config.checkout`  
6. `custom: []` unless bundle exists — intended tools in **report**, not fake common  
7. Schema extract from chat-sdk when possible (esbuild cache)

---

## 4. Pack backlog (build next)

Priority order from batch evidence:

| Priority | Pack | Trigger |
|---|---|---|
| P0 | **UA + wall classifier** | All Path B |
| P0 | **BV-as-catalog fallback** | First-party 403 + BV products live |
| P0 | **Gap Apigee brand matrix** | mybrand / api.gap.com |
| P1 | **Nike product_feed** | api.nike.com/product_feed |
| P1 | **Adidas Glass content-engine** | /api/plp/content-engine + Sec-CH |
| P1 | **Uniqlo FR commerce v5** | /api/commerce/v5 + x-fr-clientid |
| P2 | Constructor early hydrate | key_ in JS |
| P2 | JSON-LD get_product | REST PDP blocked |
| P2 | Policy Wayback/i18n medium binder | help HTML 403 |
| P3 | Session/sensor capture | Nordstrom a32, Macy’s BVM, Lulu GE401001, URBN DataDome |

---

## 5. What not to “harden” into

- Fake cart / showCheckout  
- Invented SFCC/Algolia commons from residuals  
- Claiming BV fallback has prices  
- Playwright as default (still last resort; none needed for 10/10 demo_ready)  
- Treating Wayback policies as high confidence  

---

## 6. Suggested Manifest Builder skill updates

Add to emit skill / probe skill:

1. `probe_headers.md` — Chrome+Sec-CH recipe; wall taxonomy  
2. `fallback_bv_catalog.md` — when to bind BV products as search/get  
3. `family_gap_apigee.md` — brand param table + fork instruction  
4. `quality_labels.md` — strong/commons/bv_fallback/thin_html  
5. `config_sanitize.md` — strip illegal ManifestConfig keys before write  

---

## 7. Product implication for “20 seconds”

| Class | Feasible in ≤20–60s? |
|---|---|
| J.Crew-like (vendor commons) | Yes |
| Nike/Adidas/Uniqlo/Gap-like (open BFF) | Yes with packs |
| Macy’s/Anthro/Lulu (BV fallback) | Yes (label bv_fallback) |
| Nordstrom thin | Yes (label thin_html) |
| Full custom after bot wall | No — QUEUE / held_bot_wall |

The batch proves **10/10 can be demo_ready without Playwright** if the bar and fallbacks are explicit.

---

## 8. Immediate next engineering (this week)

1. Codify UA/wall classifier + BV-as-catalog in the probe path  
2. Add `demo_ready_quality` + `needs_custom` to discovery JSON + report  
3. Sanitize Constructor/BV configs against chat-sdk validators  
4. Feed P0/P1 packs to Beacon Builder queue (Nike, Adidas, Uniqlo, Gap family already started)  
5. Re-run Adidas smoke from same header recipe as discovery (egress_fragile)

---

## 9. One-line thesis

**Robust Manifest Builder** detects *how* the site is reachable (vendor / BFF / BV / HTML / wall), emits a **spec-valid beacon** for that path, and never lies about confidence or invents commons.
