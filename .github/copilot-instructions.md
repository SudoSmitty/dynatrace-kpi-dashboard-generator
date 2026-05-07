# GitHub Copilot Instructions — Business Event Generator

This repository is an **agent**: it generates a Dynatrace Gen 3 KPI dashboard
and a 30‑minute BizEvents injector for any company a user names.

> **Read [AGENTS.md](../AGENTS.md) first.** It is the canonical instruction
> set. The notes below are Copilot‑specific reinforcement.

## When the user says "generate a dashboard for <company>"

1. Confirm `dtctl auth whoami` works. If not, stop and ask the user to run
   `scripts/check-prereqs.sh`.
2. **Show the active tenant context** (`dtctl ctx current` + `dtctl auth whoami`)
   and ask the user to confirm before any `apply`/`exec`. Never silently
   target whatever context is active.
3. Create `dashboards/<Company>/` with these files:
   - `<company>-dashboard-v1.json`
   - `<company>-injector.js`
   - `README.md`, `LEARNINGS.md`, `SALES-PITCH.md`
3. Mirror the shape of files in `.example/`.

## Hard rules

- **Gen 3 dashboard JSON only** — match `example/example_dashboard.json`.
- **Map tile is required** — `bubbleMap` over geo coordinates emitted by the
  injector.
- **Logo + Title** are TWO markdown tiles (`w:6,h:2` + `w:18,h:2`).
- **Charts use `h:4`+, KPIs use `h:2`.**
- **Time charts use `makeTimeseries`** — never `summarize` into a chart.
- All queries filter by `event.provider == "<company>.event.provider"`.
- Injector emits 3,000–5,000 events/run, batched in 500‑event POSTs.

## Workflow rule (do not violate)

There is **one injector workflow per tenant**. Always look for it first:

```bash
dtctl get workflows -o json --plain | \
  jq '.[] | select(.title | test("BizEvents Dashboard Generator|injector"; "i"))'
```

- **Found?** Add a new task `<company>_v1` to it and `dtctl apply -f`.
- **Not found?** (first‑ever run on this tenant) create from
  `.example/example_data_injector.workflow.json`.

Never create a second injector workflow.

## Tools / skills to prefer

- `dtctl` for all Dynatrace operations.
- `dt-app-dashboards`, `dt-dql-essentials`, `dt-app-notebooks`, `dtctl` skills
  if available in the agent runtime.
