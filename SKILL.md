---
name: dynatrace-kpi-dashboard-generator
description: Generate a Dynatrace Gen 3 **KPI dashboard** (15–20 business KPIs, required map tile, branded section dividers) and a matching 30‑minute BizEvents injector for a named company, then deploy both via `dtctl`. Use this skill ONLY when the user explicitly asks for a Dynatrace KPI dashboard, business-event KPI demo, BizEvents injector, or a "KPI dashboard for <company>" — do NOT use for generic Dynatrace dashboards (SRE, infra, k8s, services, RUM) or for editing existing non-KPI dashboards. Triggers include phrases like "generate a KPI dashboard", "build a BizEvents demo for <company>", "spin up a KPI dashboard + injector", "/generate-kpi-dashboard". Requires `dtctl` authenticated to a Dynatrace Gen 3 tenant.
---

# Dynatrace KPI Dashboard Generator

This skill generates a Dynatrace Gen 3 **business KPI dashboard** and the
30‑minute BizEvents injector workflow that feeds it, for any company the user
names. It is intentionally narrow: business‑event KPI dashboards only, not
generic infra/SRE/RUM dashboards.

## When to invoke

Use this skill when the user asks for any of:

- "Generate a KPI dashboard for `<company>`"
- "Build a BizEvents demo / injector for `<company>`"
- "Run `/generate-kpi-dashboard <company>`"
- A Dynatrace Gen 3 dashboard backed by synthetic business events that the
  agent must also produce.

Do **not** invoke for: existing dashboard edits unrelated to BizEvents,
infrastructure/Kubernetes/RUM/SLO dashboards, or one‑off DQL questions.

## Canonical instructions

The full, authoritative playbook lives in [AGENTS.md](AGENTS.md) at the
root of this skill. **Read it before doing anything.** It covers:

- Tenant confirmation rules (`dtctl ctx current` + `dtctl auth whoami`
  before every mutating command).
- Required dashboard structure (split logo+title header, section dividers,
  required `bubbleMap` tile above the fold, height/layout rules,
  visualization mix).
- DQL patterns and pitfalls (`makeTimeseries` vs `summarize`, multi‑select
  variable filters, ratio metrics).
- Injector schema, batching, geo fields, and event volume targets.
- Workflow rule: **one injector workflow per tenant** — add a task, never
  create a second workflow.
- Output layout under `dashboards/<Company>/` and required deliverables
  (`README.md`, `LEARNINGS.md`, `SALES-PITCH.md`).

## Reference files

When invoked from a working repo, mirror the shape of these examples
shipped alongside this skill:

- `.example/example_dashboard.json` — Gen 3 dashboard JSON shape.
- `.example/example_data_injector.workflow.json` — workflow + JS task shape.
- `.example/example-injector.js` — injector JS template.

If the skill is installed globally and the user's cwd has no `.example/`,
use the copies that live next to this `SKILL.md`.

## Required companion skills

This skill leans on:

- `dtctl` — all Dynatrace CLI operations.
- `dt-app-dashboards`, `dt-dql-essentials`, `dt-app-notebooks` — dashboard
  JSON shape and DQL correctness.

If they are not installed, tell the user to install them with
`npx skills add dynatrace-oss/dtctl` and
`npx skills add dynatrace/dynatrace-for-ai` before continuing.

## Hard rules (do not violate)

1. Never run a tenant‑mutating `dtctl` command without showing the active
   context and getting user confirmation.
2. Never create a second injector workflow on a tenant — always add a task
   to the existing one.
3. Never overwrite `*-dashboard-v1.json`; bump to `v2`, `v3`, etc.
4. Every dashboard MUST include a map tile fed by injector geo fields.
5. Verify any logo URL with `curl -sIL` before embedding.
