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
| **Step 2** — ask about a remaining commit gate | **Hard-stop instead.** No override is available without a user. See *The commit gate* below. |
| **Step 3** — determine the increment | Commit task-only hunks using the core's starting-state baseline and isolated candidate. Preserve unrelated staged/unstaged work, including mixed files; block when separation is unsafe. Report excluded unrelated work. |
| **Step 6.2** — offer proceed / edit / skip on the commit message | Generate the message per `workflow-config.md`'s commit style and **commit**. No confirmation, no skip. |
| **Step 8.1** — offer to transition the tracker ticket | Runs only in **`open PR/MR`** mode (see *Completion mode*). Never in `report only`. Governed entirely by config — not a `decisions.md` entry. |
| **Step 8.2** — `AskUserQuestion` before pushing and opening the PR | Governed by **completion mode**, not by a prompt. |
| **Step 9** — next-step line + clipboard copy | Return the stage report block from the autonomy contract instead. No `> **Next step:**` line, no clipboard. |

Everything else stands: reading the config, determining the increment from the
working tree and the plan, detecting task completion, folding the changelog into
the **same** completing commit when the project practices one, advancing covered
subtasks `reviewed → committed`, and generating a real PR title and body.

## The commit gate

Check these gates before committing, using the core's shared integrity contract:

The core's committed-scope recovery/completion-only path does not make another
code commit and must not fail merely because its phase is already `committed`.
Reconcile saved ledger/history first and resume only outstanding authorized actions.

1. **The scope is `reviewed`.** If it's still `pending` / `planned` /
   `implemented`, the pipeline ran out of order — report `STATUS: blocked`.
2. **No unfixed Blocker** in the complete ledger: only a verified `fixed` or
   evidence-backed `stale` Blocker clears the autonomous gate. Open, deferred,
   skipped, accepted, dismissed, or unknown Blocker states block this run.
3. **Required verification passed on the candidate.** Current automated evidence
   and review coverage match the candidate's source inputs. Run necessary checks
   for missing/stale evidence, or return blocked; never trust the phase/date alone.
4. **QA acceptance passed.** `## QA Verification` records `QA acceptance: passed`
   with current case evidence (or named automated equivalents) for every required
   case, and `QA retest: none`. Coverage may be incomplete only for optional cases.
   An unavailable required check or exhausted retest budget blocks; it is not a
   pass. Missing QA/provenance also blocks.

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
- **Reuse valid evidence.** Compare tested and candidate fingerprints and inputs.
  Run only necessary checks for invalid evidence, including isolated-candidate
  verification for mixed work; block if required verification cannot be completed.
- **Scope discipline is absolute now.** With no one to ask, out-of-scope changes
  are never swept in. Stage the work-item's `review.md` and only the QA evidence
  linked from its `## QA Verification` section alongside its planned changes.
  Leave unrelated files uncommitted and name them in the report.
- **The changelog rides the completing commit**, when the project practices one.
  Not a separate commit.
- **Save the committed ledger.** Follow the core's prepared record, commit,
  task-only amend, and interruption recovery procedure for both subtask headings
  and the no-subtasks `Phase`. Do not push until code and committed ledger agree.
