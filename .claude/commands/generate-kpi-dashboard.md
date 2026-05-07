---
description: Generate a Dynatrace Gen 3 KPI dashboard + BizEvents injector for a company.
argument-hint: <company name> [industry] [logo-url]
---

Generate a Dynatrace Gen 3 KPI dashboard and 30‑minute BizEvents injector for
the company **$ARGUMENTS**.

Follow `AGENTS.md` in this repository exactly. In particular:

1. Verify `dtctl auth whoami` succeeds before doing anything else.
2. **Show the active `dtctl` context to the user** (`dtctl ctx current` +
   `dtctl auth whoami`) and get explicit confirmation that the tenant is correct
   before any `dtctl apply` or `dtctl exec`.
3. Mirror the structure of files in `.example/`.
3. Output goes into `dashboards/<Company>/`:
   - `<company>-dashboard-v1.json`
   - `<company>-injector.js`
   - `README.md`, `LEARNINGS.md`, `SALES-PITCH.md`
4. The dashboard MUST contain a `bubbleMap` map tile, a split logo+title
   header, section dividers, KPI tiles (`h:2`), and charts (`h:4`+).
5. `dtctl apply` the dashboard JSON to capture the dashboard ID.
6. Look up the existing injector workflow with
   `dtctl get workflows -o json --plain | jq '.[] | select(.title | test("BizEvents Dashboard Generator|injector"; "i"))'`.
   - If found: append a new task `<company>_v1` and `dtctl apply` the
     workflow.
   - If not found: create from
     `.example/example_data_injector.workflow.json`.
   Never create a second injector workflow.
7. `dtctl exec workflow <id>` and confirm SUCCESS.
8. Verify events landed: `fetch bizevents | filter event.provider == "<company>.event.provider" | summarize count()`.
9. Report dashboard URL, workflow ID, and task name back to the user.
