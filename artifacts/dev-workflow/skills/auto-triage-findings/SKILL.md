---
name: auto-triage-findings
description: Autonomous counterpart to /triage-findings, for unattended /autopilot runs. Closes a review.md's open findings by a fixed severity rubric instead of asking the user about each one — Blockers and Majors fixed or deferred, Minors fixed or skipped, never accepted or dismissed — then re-runs the plan's checks and updates the ledger. Dispatched by /autopilot; not meant to be run by hand (use /triage-findings when a human is present).
---

# /auto-triage-findings — Resolve the findings (autonomous)

**Derived from:** `../triage-findings/SKILL.md` — read it in full and follow it
exactly, **except** where the Overrides table below replaces a step.
**Autonomy contract:** `../autopilot/assets/autonomy-contract.md` — read it too.

You have no user. This is the stage the core skill builds most explicitly around
human judgment — *"every finding is closed by a user decision, never by the
agent's own judgment"* — so it's the stage that changes most. The per-finding
question becomes a fixed rubric, and the two statuses that encode a human
accepting risk are taken off the table entirely.

## Overrides

| Core step | Autonomous replacement |
| --- | --- |
| **Step 1.2** — `AskUserQuestion` when several work-items have open findings | The dispatching prompt passes the scope explicitly. If it somehow doesn't, triage them **one `review.md` at a time**, as the core skill requires. |
| **Step 3** — one `AskUserQuestion` per finding | Apply the **rubric** below. Still walk the findings in severity order, still write each decision to `review.md` before moving to the next. |
| **Step 3** — `AskUserQuestion` offering to add a `pending` subtask for a deferred finding | **Never add a subtask.** A new `pending` subtask would send the coordinator back around the loop for work the human hasn't seen. The finding's `deferred` status plus its `decisions.md` entry is the record, and `/autopilot` surfaces it in the final report. |
| **Step 7** — next-step line + clipboard copy | Return the stage report block from the autonomy contract instead. No `> **Next step:**` line, no clipboard, no invoking the next skill. |

Everything else stands: re-reading the code at each finding's location (the
review is a snapshot), keeping fixes **minimal and targeted**, honoring the
plan's Contracts, re-running the automated checks after any fix, recording
material deviations in `## Implementation Notes`, recomputing the `review.md`
header, and **not** touching subtask status.

## The rubric

| Severity | Decision |
| --- | --- |
| **Blocker** | **Fix it.** Where the review offered two options, take the `⭐ Recommended` one. If the fix would break a plan Contract or reach outside this work-item, `deferred` with the reason — a Blocker is never left `open`. |
| **Major** | **Fix it**, unless the fix would break a Contract or reach outside the work-item's scope → `deferred` with the reason. |
| **Minor** | **Fix it** when the change is local, obvious, and low-risk. Otherwise `skipped`. |
| **any** | `stale` when the code has genuinely moved past the finding — the core skill's one agent-judged status, and still the only one. |

**`accepted` and `dismissed` are never used.** `accepted` means a human knowingly
takes a risk; `dismissed` means a human overrules the reviewer. Neither is yours
to do on their behalf, and both would silently un-gate a Blocker at
`/auto-finalize`. When you think a finding is wrong or the risk is worth taking,
that's exactly what `deferred` plus a clear reason is for — it keeps the finding
visible in the final report where a human can make that call.

**Log a decision entry** for every finding that isn't a straightforward fix:
every `deferred`, every `skipped`, every `stale`, and any fix that departed from
the suggestion. A fix applied as suggested doesn't need one — `Status: fixed` in
`review.md` already says it. Rate a `deferred` **Blocker** at `Low` confidence,
always: it's the single most consequential call this stage can make, and it will
stop `/auto-finalize` from committing.

**Fixing is the default.** The core skill notes that a triage ending in four
skips and one fix is a success — that's true when a human made those calls. Here,
skipping is the option of last resort for Minors, because a skipped finding may
never be looked at again.

## Notes

- **Act on the report, don't redo it.** Resolve the findings in front of you.
  Problems you notice along the way go in the stage report's `OUTSTANDING`, not
  into unrequested edits.
- **Minimal edits.** Change what the finding names. No opportunistic refactoring
  — an unattended run has no reviewer for work nobody asked for.
- **Re-run the checks after fixing.** The core skill's Step 4 is not optional:
  `/auto-finalize` explicitly trusts this stage and re-runs nothing. If a fix
  broke something, this is the last place it can be caught.
- **Write decisions as you go.** Per finding, not batched at the end — that's
  what makes an interrupted run resumable.
- **An unfixed Blocker stops the pipeline.** `/auto-finalize` blocks on any
  Blocker that isn't `fixed` or `stale` — `deferred` included, since the two
  statuses that normally un-gate one (`accepted`, `dismissed`) are unavailable
  to you. Deferring a Blocker is therefore a deliberate stop, not an escape
  hatch: the run ends without a commit and the reason you wrote is what the
  human gets. Take it only when fixing genuinely isn't yours to do.
