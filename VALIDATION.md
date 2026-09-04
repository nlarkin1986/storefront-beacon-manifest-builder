# Chat SDK validator gate

Ran 2026-09-04 against unpacked `chat-sdk` `web-v2`:

- Boot: `validManifest()` (`src/domain/validators/validManifest.ts`), same function `fetchManifest` uses
- Tool-call: each common’s `valid*ManifestConfig`

**Result: 11/11 passed**

Vuori, Gap, Old Navy, J.Crew, Nike, Uniqlo, Nordstrom, Macy’s, Adidas, Anthropologie, Lululemon.

## Two layers

| Gate | What it checks |
|---|---|
| `validManifest` | `version: "1.0"`, integrations shape, unique names, custom needs http(s) `bundleUrl` + required tool fields |
| `valid*ManifestConfig` | Algolia / BV / Constructor / Shopify / Storefront / TurnTo / Yotpo keys |

`object()` **strips** unknown keys instead of throwing. Gold Vuori still *validates* with traps that break at runtime (`shopify.storeDomain` ignored, `yotpo.siteId` ignored, lowercase Algolia `appId` 403s). Emit Path A with uppercase `appId`, empty Shopify config, storefront `shopDomain` only, no Yotpo, no `showCheckout`. Strip `_notes` before emit.

## Re-run in chat-sdk

Copy `scripts/validManifest.gate.test.ts` into `web-v2/src/domain/validators/` (or point `FILES` at this repo’s `examples/`) and:

```sh
npx vitest run src/domain/validators/validManifest.gate.test.ts
```
