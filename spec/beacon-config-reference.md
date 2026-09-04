# Beacon common-integration manifest configs

Source: chat-sdk `web-v2/src/integrations/*/config.ts` (zip f943d46).
Only these keys are valid on `integrations.common[].config`. Extra keys (e.g. Shopify `storeDomain`, Yotpo `siteId`, Bazaarvoice `passkey`) are **not** ManifestConfig fields in this SDK revision.

| integration | required config | optional config |
|---|---|---|
| `algolia` | (none — detect) | appId, apiKey, indexName, customHosts, suggestionsIndexName, defaultFilters, filterableFields, mapping, mappingOverrides |
| `bazaarvoice` | (none — detect) | clientName, bfdToken, locale |
| `boost` | (none or shop) | shopDomain (`*.myshopify.com`), … see config.ts |
| `chilipiper` | see config.ts | domain / subdomain fields |
| `constructorio` | key | recommendationPods, mapping, … |
| `dynamicyield` | (none) | recommendations placements, pollTimeoutMs |
| `klaviyo-reviews` | (none — detect) | companyId |
| `magento` | baseUrl / store paths | mapping, guest cart paths, … |
| `marketo` | munchkin / form fields | … |
| `okendo` | (none — detect) | subscriberId, productIdPrefix |
| `powerreviews` | merchantId, apiKey | locale, … |
| `reviewsio` | (none — detect) | storeId |
| `sap-commerce` | baseSite, apiBase, … | checkoutOperations, csrf*, deliveryTaxEstimatePath, … |
| `searchspring` | siteId | mapping, … |
| `servicify` | shop / widget ids | … |
| `sfcc` | siteId / controllers | locale, currency, variant patterns, … |
| `shopify` | (none) | searchLimit, mapping, mappingOverrides |
| `shopify-storefront` | shopDomain | storefrontAccessToken, apiVersion, country, language, metafields, articleBlogs, articleUrlPattern, mapping* |
| `stockist` | widgetTag | … |
| `stylitics` | account / bundle | min/max, api base |
| `sweetiq` | clientKey | … |
| `trustpilot` | (none — detect) | businessUnitId, locale |
| `turnto` | (none — detect) | siteKey, … |
| `unbxd` | apiKey, siteKey | filters, … |
| `yotpo` | (none — detect) | appKey (not siteId) |

## Rules (beacon-manifest skill)

1. `common` = vendor platforms only — names must be `COMMON_INTEGRATIONS` keys.
2. Tool `description`/`inputSchema` extracted from `integrations/{name}/index.ts`, not hand-written.
3. Tool objects only: `name`, `description`, `inputSchema`, `outputSchema?`, `annotations?`. Strip `navigatesPage`.
4. Customer-owned APIs (e.g. Gap `api.gap.com`) belong in `custom` with `bundleUrl` + tools — not invented under `common`.
5. Example configs: `local-chat-balsamhill-manifest.json` (constructorio + bazaarvoice + sap-commerce + custom).