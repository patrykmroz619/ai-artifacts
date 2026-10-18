---
name: auto-finalize
description: Autonomous counterpart to /finalize, for unattended /autopilot runs. Commits the reviewed increment with a conventions-following message and no confirmation, hard-stops on an unfixed Blocker instead of warning, and on the task-completing increment adds the changelog and either opens the PR/MR or prints the command — whichever workflow-config.md's Autopilot completion mode pre-authorized. Dispatched by /autopilot; not meant to be run by hand (use /finalize when a human is present).
---

# /auto-finalize — Commit the increment (autonomous)

**Derived from:** `../finalize/SKILL.md` — read it in full and follow it
exactly, **except** where the Overrides table below replaces a step.
**Autonomy contract:** `../autopilot/assets/autonomy-contract.md` — read it too.

You have no user. Committing is local and expected, so it proceeds without
asking. **Pushing, opening a PR/MR, and transitioning a tracker ticket are
outward-facing**, and they happen only when the project pre-authorized them in
`workflow-config.md`'s `## Autopilot` section — never on your own judgment that
the work looks finished.

## Overrides

| Core step | Autonomous replacement |
| --- | --- |
| **Step 1.2** — ask when the scope is ambiguous | The dispatching prompt passes the scope explicitly. Use it. |
| **Step 2** — warn on an unreviewed scope or open Blockers, then `AskUserQuestion` whether to commit anyway | **Hard-stop instead.** No override is available without a user. See *The commit gate* below. |
| **Step 3.3** — `AskUserQuestion` when the tree holds changes beyond the scope | **Always commit scope-only.** Stage the files the plan's Target Structure and the work-item's records account for, and nothing else. Log a decision entry naming the out-of-scope files you left uncommitted, so they surface in the final report. |
| **Step 6.2** — offer proceed / edit / skip on the commit message | Generate the message per `workflow-config.md`'s commit style and **commit**. No confirmation, no skip. |
| **Step 8.1** — offer to transition the tracker ticket | Runs only in **`open PR/MR`** mode (see *Completion mode*). Never in `report only`. Governed entirely by config — not a `decisions.md` entry. |
| **Step 8.2** — `AskUserQuestion` before pushing and opening the PR | Governed by **completion mode**, not by a prompt. |
| **Step 9** — next-step line + clipboard copy | Return the stage report block from the autonomy contract instead. No `> **Next step:**` line, no clipboard. |

Everything else stands: reading the config, determining the increment from the
working tree and the plan, detecting task completion, folding the changelog into
the **same** completing commit when the project practices one, advancing covered
subtasks `reviewed → committed`, and generating a real PR title and body.

## The commit gate

Check all three, before staging anything:

1. **The scope is `reviewed`.** If it's still `pending` / `planned` /
   `implemented`, the pipeline ran out of order — report `STATUS: blocked`.
2. **No unfixed Blocker** in the work-item's `review.md`. Blocking statuses are
   **`open` and `deferred`**; only `fixed` and `stale` clear a Blocker. This is
   deliberately stricter than the core skill, which also clears on `accepted` and
   `dismissed` — `/auto-triage-findings` can't use either, so a `deferred`
   Blocker is an unresolved one.
3. **QA stage recorded.** The work-item's `review.md` has `## QA Verification`
   with `QA status: complete`, `incomplete`, or `skipped`, and `QA retest: none`.
   An incomplete run is reported as outstanding, not treated as a pass or a
   separate commit gate. Missing QA or a required retest means the coordinator
   ran out of order; return `STATUS: blocked` without committing.

On any failure, report `STATUS: blocked` naming the relevant finding IDs or
missing QA marker and stop. Do
not commit, do not advance status. The core skill's warn-and-let-the-user-decide
path needs a user; there isn't one, and committing over a Blocker is not a
default worth taking silently.

Majors and Minors never gate, exactly as in the core skill.

## Completion mode

Read `specs/workflow-config.md`'s **`## Autopilot`** section. It governs every
outward-facing action in this stage:

| Mode | What you do on the task-completing increment |
| --- | --- |
| **`open PR/MR`** | Push the branch and open the PR/MR through the recorded CLI (`gh pr create` / `glab mr create`), using the enriched body below. Offer the tracker transition too, per the config's task-management section. |
| **`report only`** | Commit locally. **Push nothing, open nothing, transition nothing.** Put the exact ready-to-run command, the title, and the body in the stage report's `OUTSTANDING`. |
| **Section absent** | Treat as **`report only`**. A project configured before this section existed never pre-authorized a push. Note the absence in the report. |

In `open PR/MR` mode, verify the CLI is actually available and authenticated
(e.g. `gh auth status`) **before** relying on it. If it isn't, fall back to
report-only behavior and say why — never fabricate a push, a PR, or a ticket
transition, per the core skill's config-driven-and-graceful rule.

Non-completing increments commit and stop regardless of mode; there's no PR to
prepare yet.

## The PR/MR body

Beyond the core skill's summary of the task and the subtasks delivered, add a
**Key decisions** section drawn from `specs/tasks/{task}/decisions.md`:

```markdown
## Key decisions

Made autonomously during this run — see `specs/tasks/{task}/decisions.md` for all N.

- **Token refresh in middleware, not per route.** Rejected per-route refresh
  (four call sites repeating the branch) and a background timer (no scheduler in
  this codebase). _Confidence: High_
- **Retry budget capped at 3.** Rejected exponential backoff without a cap —
  the upstream API's rate limit makes an unbounded retry worse than a fast
  failure. _Confidence: Low — sanity-checked and confirmed._
```

Pick the **crucial** ones — decisions that shaped the architecture, constrained
future work, or were rated `Low` confidence. Not all of them; a wall of entries
buries the two that matter. Carry the **rejected alternatives** across, because
that's what a reviewer can't reconstruct from the diff.

Also list, plainly, anything still outstanding: deferred or skipped findings, and
manual verification nobody performed. A reviewer opening an autonomously produced
PR needs to know what wasn't checked.

## Notes

- **Committing is local; everything else is authorized elsewhere.** The
  completion mode is the only thing that permits a push, a PR/MR, or a ticket
  transition. When in doubt about what the config says, take the conservative
  reading — the run reports the command instead, and a human runs it in seconds.
- **No decision-log entry for the tracker transition.** Whether it happens is
  fully determined by `workflow-config.md`'s completion mode and task-management
  section, not a judgment call — there's nothing here for `decisions.md` to
  audit.
- **No re-verification here.** Like the core skill, this stage trusts
  `/auto-review-implementation` and `/auto-triage-findings` and re-runs no
  checks. That trust is exactly why the commit gate is strict.
- **Scope discipline is absolute now.** With no one to ask, out-of-scope changes
  are never swept in. Stage the work-item's `review.md` and only the QA evidence
  linked from its `## QA Verification` section alongside its planned changes.
  Leave unrelated files uncommitted and name them in the report.
- **The changelog rides the completing commit**, when the project practices one.
  Not a separate commit.
- **Status lives in `task-plan.md`.** Advance covered subtasks to `committed`
  only after the commit actually lands. A status advance without a commit strands
  the run: the coordinator reads the ledger and routes past work that was never
  saved.
