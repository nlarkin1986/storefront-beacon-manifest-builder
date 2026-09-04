/**
 * Drop this file into chat-sdk web-v2 (or run from web-v2 with FILES pointing here).
 * It imports the real SDK validators — it will not run inside this spec repo alone.
 *
 * 2026-09-04: 11/11 passed against these example beacons.
 */
import { readFileSync } from 'node:fs';
import { validManifest } from '@/domain/validators/validManifest';
import { COMMON_INTEGRATIONS } from '@/integrations/registry';
import { validAlgoliaManifestConfig } from '@/integrations/algolia/config';
import { validBazaarvoiceManifestConfig } from '@/integrations/bazaarvoice/config';
import { validConstructorioManifestConfig } from '@/integrations/constructorio/config';
import { validShopifyManifestConfig } from '@/integrations/shopify/config';
import { validShopifyStorefrontManifestConfig } from '@/integrations/shopify-storefront/config';
import { validTurnToManifestConfig } from '@/integrations/turnto/config';
import { validYotpoManifestConfig } from '@/integrations/yotpo/config';

const CONFIG_VALIDATORS: Record<string, (v: unknown) => unknown> = {
  algolia: validAlgoliaManifestConfig,
  bazaarvoice: validBazaarvoiceManifestConfig,
  constructorio: validConstructorioManifestConfig,
  shopify: validShopifyManifestConfig,
  'shopify-storefront': validShopifyStorefrontManifestConfig,
  turnto: validTurnToManifestConfig,
  yotpo: validYotpoManifestConfig,
};

const FILES = [
  'examples/path-a/vuoriclothing.com.beacon-manifest.json',
  'examples/path-a/jcrew.com.beacon-manifest.json',
  'examples/path-b/gap.com.beacon-manifest.json',
  'examples/path-b/oldnavy.gap.com.beacon-manifest.json',
  'examples/path-b/nike.com.beacon-manifest.json',
  'examples/path-b/uniqlo.com.beacon-manifest.json',
  'examples/path-b/adidas.com.beacon-manifest.json',
  'examples/thin/nordstrom.com.beacon-manifest.json',
  'examples/thin/macys.com.beacon-manifest.json',
  'examples/thin/anthropologie.com.beacon-manifest.json',
  'examples/thin/lululemon.com.beacon-manifest.json',
];

describe('emitted beacons vs chat-sdk validators', () => {
  it.each(FILES)('validManifest + ManifestConfig: %s', (path) => {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    const parsed = validManifest(raw);
    expect(parsed.version).toBe('1.0');
    for (const entry of parsed.integrations.common) {
      expect(COMMON_INTEGRATIONS[entry.name], `unknown common name ${entry.name}`).toBeTruthy();
      const v = CONFIG_VALIDATORS[entry.name];
      expect(v, `no ManifestConfig validator wired for ${entry.name}`).toBeTypeOf('function');
      expect(() => v(entry.config ?? {})).not.toThrow();
    }
    for (const custom of parsed.integrations.custom) {
      expect(custom.bundleUrl).toMatch(/^https?:\/\//);
      for (const tool of custom.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeTruthy();
      }
    }
  });
});
