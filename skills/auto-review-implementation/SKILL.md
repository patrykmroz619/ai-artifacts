---
name: auto-review-implementation
description: Autonomous counterpart to /review-implementation, for unattended /autopilot runs. Reviews a work-item's changes against its plan, acceptance criteria, and coding standards, and writes review.md — report-only, exactly like the core skill, with only the scope-disambiguation question and the hand-off replaced. Dispatched by /autopilot; not meant to be run by hand (use /review-implementation when a human is present).
---

# /auto-review-implementation — Independent review (autonomous)

**Derived from:** `../review-implementation/SKILL.md` — read it in full and
follow it exactly, **except** where the Overrides table below replaces a step.
**Autonomy contract:** `../autopilot/assets/autonomy-contract.md` — read it too.

This is the **lightest** of the autonomous stages, because the core skill barely
involves the user: it is already report-only and its findings already go to a
separate triage step. Almost nothing changes. What does change is how much
weight the report carries — see the Notes.

## Overrides

| Core step | Autonomous replacement |
| --- | --- |
| **Step 1.2** — `AskUserQuestion` when more than one work-item is unreviewed | The dispatching prompt passes the scope explicitly, which pre-empts this. If it somehow doesn't, review **all** not-yet-reviewed work-items — one `review.md` each, from a single analysis pass, exactly as the core skill specifies. |
| **Step 8** — next-step line + clipboard copy | Return the stage report block from the autonomy contract instead. No `> **Next step:**` line, no clipboard, no invoking `/auto-triage-findings` or `/auto-finalize`. |

Everything else stands **unchanged**: the severity scale and verdict thresholds,
the diff classification in Step 3, all core analysis dimensions, the `review.md`
template with `Status: open` on every finding, the `implemented → reviewed`
status advance, and the Step 7 self-review of the report.

You write **no decision entries** in the normal case. A review reports findings;
it doesn't choose between options. The one exception is a judgment call about the
review itself — deciding a diff is out of scope for this work-item, or that a
plan step was legitimately superseded — which gets a log entry like any other
call a human would have weighed in on.

## Notes

- **This is the run's main quality signal.** Everything upstream of you was
  produced by agents with nobody checking, and everything downstream acts on what
  you write. `/auto-triage-findings` fixes what you flag and nothing else; the
  commit gate reads the Blockers you assign. A finding you don't write is a
  problem that ships.
- **Independence is the whole point, and here it's real.** You are a fresh agent
  that did not write this code and did not make the decisions behind it. Read the
  diff on its own terms rather than reconstructing why it's probably fine.
- **Read `decisions.md` alongside the plan.** The entries for this work-item —
  especially anything logged at `Low` confidence — say exactly where an agent was
  unsure. That's the highest-yield place to look, alongside the
  `## Implementation Notes` the core skill already sends you to.
- **Severity is load-bearing now.** `Blocker` means `/auto-finalize` will refuse
  to commit; `Minor` means it likely gets skipped without a human ever seeing it.
  Grade on the real risk — neither inflate to force attention nor soften to keep
  the pipeline moving.
- **Watch for the failure modes autonomy invites**: acceptance criteria that were
  quietly reinterpreted rather than met, verification commands reported green
  that don't actually cover the change, a plan followed faithfully into a bad
  outcome, and scope that crept because no one pushed back. The core skill's
  reminder that **the plan can be wrong too** matters most here.
- **Still report-only.** Never edit source. `/auto-triage-findings` acts on the
  findings; that separation is what keeps this review worth having.
- **No hand-off exists — the plan's `## Verification Log` is all you get.** You are
  dispatched as a fresh subagent with none of `/auto-implement`'s conversation, so
  there is nothing to "carry over" except what's on disk. Read the plan's
  `## Verification Log` for automated-check status and never invoke test/lint/build
  commands yourself; a missing log is a finding, not a reason to run one.
