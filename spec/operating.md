# Manifest Builder — operating rules (post Path B batch)

Updated: 2026-09-04T12:54Z

## Chosen approach

1. **Standing skill** `spec/path-b-storefront-probe.md` — decision tree, UA/wall taxonomy, BV-as-catalog, Gap fork, beacon hygiene.
2. **Emit stamps** on every discovery JSON — use `schemas/discovery-emit-template.json` fields: `demo_ready_quality`, `needs_custom`, `wall_class`, `egress_fragile`, `probe_headers`.
3. **Packs stay with Beacon Builder** — Manifest Builder discovers + labels; does not ship custom bundles.
4. **Full write-up** — `spec/path-b-hardening.md`

## Why this over coding packs first

Skill + labels make every future run comparable and Scout-ready without waiting on per-BFF pack code. Pack code without labels still produces ambiguous "demo_ready yes" (Nordstrom ≈ Nike). Labels fix the product contract; packs fix coverage later.

## Every probe checklist

- [ ] Read/run Path B storefront probe skill
- [ ] Chrome(+Sec-CH) first; classify wall
- [ ] Fork: commons → BFF → BV → thin HTML → QUEUE
- [ ] Stamp quality + needs_custom + wall_class
- [ ] Beacon: registry commons only; ManifestConfig keys only; custom [] until bundle
- [ ] Report pack hole one-liner for Scout/Beacon Builder
