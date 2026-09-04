#!/usr/bin/env node
/**
 * CLI: URL → ProbePackage JSON (stdout)
 *
 *   node bin/probe.mjs https://www.vuoriclothing.com
 *   node bin/probe.mjs vuoriclothing.com --out /tmp/probe.json
 *
 * No extra deps. Node 18+ (global fetch).
 */
import { writeFileSync } from 'node:fs';
import { probeStorefront } from '../src/probe/httpProbe.mjs';

function usage() {
  console.error('Usage: node bin/probe.mjs <storefront-url> [--out file.json]');
  process.exit(2);
}

const args = process.argv.slice(2);
if (!args.length || args.includes('-h') || args.includes('--help')) usage();

let outPath = null;
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') {
    outPath = args[++i];
  } else {
    positional.push(args[i]);
  }
}
const url = positional[0];
if (!url) usage();

const probe = await probeStorefront(url);
const json = JSON.stringify(probe, null, 2);
if (outPath) {
  writeFileSync(outPath, json + '\n');
  console.error(`wrote ${outPath} (${probe.domain})`);
} else {
  console.log(json);
}
