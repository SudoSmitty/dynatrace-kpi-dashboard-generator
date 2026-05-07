---
mode: agent
description: Generate a Dynatrace Gen 3 KPI dashboard + BizEvents injector for a company.
---

You are operating in the **Business Event Generator** repository. Follow the
instructions in [AGENTS.md](../../AGENTS.md) exactly.

Inputs you need from the user (ask if missing):

- Company name
- Industry / business domain (optional)
- Logo URL (optional — search the web if not provided)

Then:

1. Run `dtctl auth whoami` to confirm tenant access.
2. **Display the active `dtctl` context** (`dtctl ctx current` +
   `dtctl auth whoami`) and ask the user to confirm the tenant before applying
   or executing anything.
3. Research 15–20 industry KPIs and matching event types.
3. Create `dashboards/${input:company}/` with dashboard JSON,
   injector JS, README, LEARNINGS, SALES-PITCH — using the files in
   `.example/` as the structural template.
4. The dashboard MUST include a `bubbleMap` tile fed by geo coordinates from
   the injector.
5. `dtctl apply` the dashboard.
6. Find the existing injector workflow (`dtctl get workflows`), append a new
   task for this company, `dtctl apply` it, then `dtctl exec workflow`.
   Only create a new workflow if none exists in the tenant.
7. Verify ingestion with a `fetch bizevents | filter event.provider == ...`
   query and report the dashboard URL + workflow ID back to the user.
