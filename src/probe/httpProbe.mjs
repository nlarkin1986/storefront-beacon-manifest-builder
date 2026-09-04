/**
 * HTTP-only storefront probe → ProbePackage (evidence only).
 * Railway / AssociateRuntime re-binds beacon-manifest; draftBeacon is never SoT.
 *
 * Usage (module):
 *   import { probeStorefront } from '../src/probe/httpProbe.mjs';
 *   const probe = await probeStorefront('https://www.example.com');
 *
 * Aligns with schemas/probe-package.schema.json + AGENTS.md Path B skill.
 */

export const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export const CHROME_HEADERS = {
  'User-Agent': CHROME_UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-CH-UA': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"macOS"',
};

function apexFromHost(host) {
  const h = String(host || '').replace(/^www\./i, '');
  return h || '';
}

function domainFromOrigin(origin) {
  try {
    return apexFromHost(new URL(origin).hostname);
  } catch {
    return '';
  }
}

export function normalizeOrigin(input) {
  let raw = String(input || '').trim();
  if (!raw) throw new Error('url_required');
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  const u = new URL(raw);
  return `${u.protocol}//${u.host}`;
}

async function fetchText(url, { headers = {}, method = 'GET', body, timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: { ...CHROME_HEADERS, ...headers },
      body,
      redirect: 'follow',
      signal: ctrl.signal,
    });
    const text = await res.text().catch(() => '');
    return { url: res.url || url, status: res.status, headers: res.headers, text };
  } catch (err) {
    return { url, status: 0, error: String(err?.message || err), text: '' };
  } finally {
    clearTimeout(t);
  }
}

function extractScriptSrcs(html, origin) {
  const srcs = [];
  const re = /<script[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      srcs.push(new URL(m[1], origin).href);
    } catch {
      /* skip */
    }
  }
  return [...new Set(srcs)].slice(0, 40);
}

function harvestKeysFromText(text, { url = '' } = {}) {
  const keys = {};
  const blob = `${url}\n${text}`;

  // Algolia — appId often 10 alphanumeric; search-only key ~32 hex
  const algoliaApp =
    blob.match(/X-Algolia-Application-Id["'\s:=]+([A-Z0-9]{8,16})/i) ||
    blob.match(/["']appId["']\s*:\s*["']([A-Z0-9]{8,16})["']/i) ||
    blob.match(/algolia.*?application[_-]?id["'\s:=]+([A-Z0-9]{8,16})/i);
  const algoliaKey =
    blob.match(/X-Algolia-API-Key["'\s:=]+([a-f0-9]{20,64})/i) ||
    blob.match(/["']apiKey["']\s*:\s*["']([a-f0-9]{20,64})["']/i);
  const algoliaIndex =
    blob.match(/["']indexName["']\s*:\s*["']([a-zA-Z0-9_\-]{3,80})["']/) ||
    blob.match(/indexes\/([a-zA-Z0-9_\-]{3,80})/);
  if (algoliaApp || algoliaKey) {
    keys.algolia = {
      ...(algoliaApp ? { appId: algoliaApp[1].toUpperCase() } : {}),
      ...(algoliaKey ? { apiKey: algoliaKey[1] } : {}),
      ...(algoliaIndex ? { indexName: algoliaIndex[1] } : {}),
    };
  }

  // Constructor.io public index key
  const cio = blob.match(/\b(key_[A-Za-z0-9]{8,40})\b/);
  if (cio) keys.constructorio = { key: cio[1] };

  // Bazaarvoice clientName
  const bvClient =
    blob.match(/["']clientName["']\s*:\s*["']([A-Za-z0-9_\-]{2,64})["']/) ||
    blob.match(/bv\.js.*?\/([A-Za-z0-9_\-]{2,64})\//i);
  const bvLocale = blob.match(/["']locale["']\s*:\s*["']([a-z]{2}_[A-Z]{2})["']/);
  const bfd = blob.match(/\b(\d+,[A-Za-z0-9_.-]+,[a-z]{2}_[A-Z]{2})\b/);
  if (bvClient || bfd) {
    keys.bazaarvoice = {
      ...(bvClient ? { clientName: bvClient[1] } : {}),
      ...(bvLocale ? { locale: bvLocale[1] } : { locale: 'en_US' }),
      ...(bfd ? { bfdToken: bfd[1] } : {}),
    };
  }

  // TurnTo siteKey
  const turnto = blob.match(/["']siteKey["']\s*:\s*["']([A-Za-z0-9]{8,64})["']/) || blob.match(/turnto\.com\/.*?\/([A-Za-z0-9]{10,64})\//i);
  if (turnto) keys.turnto = { siteKey: turnto[1], locale: 'en_US' };

  // Yotpo appKey (not siteId field name in ManifestConfig)
  const yotpo =
    blob.match(/staticw2\.yotpo\.com\/([A-Za-z0-9_-]{15,50})\//) ||
    blob.match(/\/v1\/widget\/([A-Za-z0-9_-]{15,50})\//) ||
    blob.match(/["']appKey["']\s*:\s*["']([A-Za-z0-9_-]{15,50})["']/);
  if (yotpo) keys.yotpo = { appKey: yotpo[1] };

  // Shopify
  const myshopify = blob.match(/\b([a-z0-9][a-z0-9-]{2,60}\.myshopify\.com)\b/i);
  if (myshopify) {
    keys.shopify = { myshopify: myshopify[1].toLowerCase() };
    keys.shopifyStorefront = { shopDomain: myshopify[1].toLowerCase(), apiVersion: '2024-10' };
  }
  if (/cdn\.shopify\.com|Shopify\.shop|\/products\/\{?handle\}?\.js/i.test(blob)) {
    keys.shopify = keys.shopify || {};
  }

  return keys;
}


function harvestFromUrls(urls = []) {
  const keys = {};
  for (const url of urls) {
    const u = String(url);
    const yotpo =
      u.match(/cdn-loyalty\.yotpo\.com\/loader\/([A-Za-z0-9_-]{15,50})/) ||
      u.match(/cdn-widgetsrepository\.yotpo\.com\/v1\/loader\/([A-Za-z0-9_-]{15,50})/) ||
      u.match(/staticw2\.yotpo\.com\/([A-Za-z0-9_-]{15,50})\//);
    if (yotpo) keys.yotpo = { appKey: yotpo[1] };
    const myshopify = u.match(/\b([a-z0-9][a-z0-9-]{1,60}\.myshopify\.com)\b/i);
    if (myshopify) {
      const host = myshopify[1].toLowerCase();
      keys.shopify = { ...(keys.shopify || {}), myshopify: host };
      keys.shopifyStorefront = { shopDomain: host, apiVersion: '2024-10' };
    }
    if (/algolia\.net|algolianet\.com/i.test(u)) {
      const app = u.match(/\/\/([A-Z0-9]{6,16})-dsn\.algolia/i);
      if (app) keys.algolia = { ...(keys.algolia || {}), appId: app[1].toUpperCase() };
    }
  }
  return keys;
}

function mergeKeys(...bags) {
  const out = {};
  for (const bag of bags) {
    if (!bag || typeof bag !== 'object') continue;
    for (const [k, v] of Object.entries(bag)) {
      out[k] = { ...(out[k] || {}), ...(v || {}) };
    }
  }
  return out;
}

function guessPlatform(html, keys) {
  if (keys.shopify || keys.shopifyStorefront) {
    if (/__NEXT_DATA__|next\/static/i.test(html)) return 'shopify_headless_next';
    return 'shopify';
  }
  if (/api\.gap\.com|gap_custom|mybrand=/i.test(html)) return 'gap_custom_next';
  if (/__NEXT_DATA__/i.test(html)) return 'nextjs';
  if (/Salesforce|Demandware|SFCC/i.test(html)) return 'sfcc';
  return 'unknown';
}

function classifyWall(status, body = '') {
  if (status === 0) return { class: 'none', notes: 'network_error' };
  if (status === 200) return { class: 'none' };
  const b = String(body).slice(0, 2000);
  if (/a32|sensor|akamai/i.test(b) || status === 403) {
    if (/datadome/i.test(b)) return { class: 'datadome', notes: `HTTP ${status}` };
    if (/bot.?manager|bvm/i.test(b)) return { class: 'akamai_bvm', notes: `HTTP ${status}` };
    return { class: 'akamai_a32', notes: `HTTP ${status}` };
  }
  if (/GE401001/i.test(b)) return { class: 'ge401001', notes: `HTTP ${status}` };
  if (/imperva|incapsula/i.test(b)) return { class: 'imperva', notes: `HTTP ${status}` };
  if (status >= 400) return { class: 'none', notes: `HTTP ${status}` };
  return { class: 'none' };
}

async function probeMcp(origin) {
  const endpoints = [];
  const candidates = [
    `${origin}/.well-known/mcp.json`,
    `${origin}/api/mcp`,
    `${origin}/mcp`,
  ];
  // checkout subdomain heuristic
  try {
    const u = new URL(origin);
    const checkout = `${u.protocol}//checkout.${u.hostname.replace(/^www\./, '')}`;
    candidates.push(`${checkout}/api/mcp`);
  } catch {
    /* skip */
  }

  for (const url of candidates) {
    const r = await fetchText(url, {
      method: url.includes('mcp.json') ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: url.includes('mcp.json')
        ? undefined
        : JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      timeoutMs: 10000,
    });
    endpoints.push({ url, status: r.status, finalUrl: r.url });
  }

  const live = endpoints.some((e) => e.status === 200);
  const partial = endpoints.some((e) => e.status > 0 && e.status < 500 && e.status !== 404);
  return {
    status: live ? 'live' : partial ? 'partial' : 'missing',
    endpoints,
  };
}

async function liveCheckAlgolia(algolia) {
  if (!algolia?.appId || !algolia?.apiKey) return null;
  const appId = algolia.appId.toUpperCase();
  const index = algolia.indexName || 'products';
  const url = `https://${appId}-dsn.algolia.net/1/indexes/*/queries`;
  const r = await fetchText(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Algolia-Application-Id': appId,
      'X-Algolia-API-Key': algolia.apiKey,
    },
    body: JSON.stringify({
      requests: [{ indexName: index, params: 'query=test&hitsPerPage=1' }],
    }),
    timeoutMs: 12000,
  });
  let sampleKeys = [];
  try {
    const j = JSON.parse(r.text);
    const hit = j?.results?.[0] || j;
    sampleKeys = hit && typeof hit === 'object' ? Object.keys(hit).slice(0, 12) : [];
  } catch {
    /* skip */
  }
  return { id: 'algolia.search', url, status: r.status, sampleKeys };
}

async function liveCheckConstructor(cio) {
  if (!cio?.key) return null;
  const url = `https://ac.cnstrc.com/search/${encodeURIComponent('test')}?key=${encodeURIComponent(cio.key)}&num_results_per_page=1`;
  const r = await fetchText(url, { timeoutMs: 12000 });
  let sampleKeys = [];
  try {
    const j = JSON.parse(r.text);
    sampleKeys = Object.keys(j).slice(0, 12);
  } catch {
    /* skip */
  }
  return { id: 'constructorio.search', url: url.split('?')[0], status: r.status, sampleKeys };
}

async function liveCheckShopifyAjax(origin) {
  const url = `${origin}/products.json?limit=1`;
  const r = await fetchText(url, { timeoutMs: 10000 });
  return { id: 'shopify.products_json', url, status: r.status };
}

/**
 * @param {string} url
 * @param {{ maxScripts?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<object>} ProbePackage
 */
export async function probeStorefront(url, opts = {}) {
  const origin = normalizeOrigin(url);
  const domain = domainFromOrigin(origin);
  const apex = domain;
  const maxScripts = opts.maxScripts ?? 8;
  const capturedAt = new Date().toISOString();
  const httpEvidence = [];
  const liveChecks = [];
  const gaps = [];

  const home = await fetchText(origin, {
    headers: { Referer: origin, Origin: origin },
  });
  httpEvidence.push({
    url: home.url || origin,
    status: home.status,
    signals: [],
  });
  const wallHints = classifyWall(home.status, home.text);

  const scriptSrc = home.text ? extractScriptSrcs(home.text, origin) : [];
  let keys = mergeKeys(
    harvestKeysFromText(home.text || '', { url: origin }),
    harvestFromUrls(scriptSrc),
  );

  // Fetch a few same-origin / CDN scripts for keys
  const ranked = scriptSrc
    .map((s) => {
      let score = 0;
      if (/algolia|cnstrc|constructor|yotpo|bazaarvoice|bv\.js|shopify|prg\.|storefront/i.test(s)) score += 5;
      if (/_next\/static\/chunks\/pages|_app|checkout/i.test(s)) score += 2;
      if (/\.(js)(\?|$)/i.test(s)) score += 1;
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const toFetch = ranked.slice(0, maxScripts).map((x) => x.s);

  for (const src of toFetch) {
    const r = await fetchText(src, { timeoutMs: 12000 });
    httpEvidence.push({ url: src, status: r.status, signals: [] });
    if (r.status === 200 && r.text) {
      keys = mergeKeys(keys, harvestKeysFromText(r.text, { url: src }));
    }
  }

  const mcp = await probeMcp(origin);
  if (mcp.status === 'missing') gaps.push('mcp_missing');

  if (keys.algolia) {
    const check = await liveCheckAlgolia(keys.algolia);
    if (check) liveChecks.push(check);
    if (check && check.status !== 200) gaps.push('algolia_search_failed');
  }
  if (keys.constructorio) {
    const check = await liveCheckConstructor(keys.constructorio);
    if (check) liveChecks.push(check);
  }
  if (keys.shopify || /shopify/i.test(home.text || '')) {
    const check = await liveCheckShopifyAjax(origin);
    if (check) liveChecks.push(check);
  }

  gaps.push('cart_write_requires_shopper_session');

  const platform = guessPlatform(home.text || '', keys);
  let platform_host = null;
  if (keys.shopify?.myshopify) platform_host = keys.shopify.myshopify;
  try {
    const checkout = `checkout.${new URL(origin).hostname.replace(/^www\./, '')}`;
    if (/shopify/i.test(platform)) platform_host = platform_host || checkout;
  } catch {
    /* skip */
  }

  const probe = {
    schemaVersion: '1.0',
    domain,
    origin,
    apex,
    capturedAt,
    discovered_at: capturedAt,
    platform,
    platform_host,
    page: { url: home.url || origin, title: (home.text || '').match(/<title[^>]*>([^<]*)/i)?.[1]?.trim() || '' },
    harvest: {
      scriptSrc: scriptSrc.slice(0, 40),
      network: httpEvidence.map((e) => ({ url: e.url, method: 'GET' })),
      keys,
    },
    liveChecks,
    mcp,
    wallHints,
    surfaces: {
      storefront_mcp: mcp.status === 'live' ? 'live' : 'missing',
      ucp_mcp: 'missing',
      webmcp: 'unknown',
      mcp_probe: Object.fromEntries(mcp.endpoints.map((e) => [e.url, e.status])),
    },
    tools: [],
    gaps,
    fingerprint: {
      scriptCount: scriptSrc.length,
      homeStatus: home.status,
      hasNextData: /__NEXT_DATA__/i.test(home.text || ''),
      hasShopify: Boolean(keys.shopify || keys.shopifyStorefront),
    },
    evidence: {
      keys,
      http: httpEvidence,
      mcp,
      scriptSrc: scriptSrc.slice(0, 40),
    },
    draftBeacon: null,
  };

  return probe;
}

export default probeStorefront;
