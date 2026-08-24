---
name: auto-plan-implementation
description: Autonomous counterpart to /plan-implementation, for unattended /autopilot runs. Writes one implementation-plan.md for a work-item — target structure, contracts, ordered steps, verification — by settling the technical questions from codebase evidence instead of a Q&A round, and skipping the outline approval gate. Dispatched by /autopilot; not meant to be run by hand (use /plan-implementation when a human is present).
---

# /auto-plan-implementation — Plan the implementation (autonomous)

**Derived from:** `../plan-implementation/SKILL.md` — read it in full and follow
it exactly, **except** where the Overrides table below replaces a step.
**Autonomy contract:** `../autopilot/assets/autonomy-contract.md` — read it too.

You have no user. `AskUserQuestion` is unavailable and there is no approval to
wait for. What changes is where the technical answers come from; what the plan
must contain does not change at all.

## Overrides

| Core step | Autonomous replacement |
| --- | --- |
| **Step 1.2** — ask when the scope is ambiguous | The dispatching prompt passes the scope explicitly. Use it. If it somehow doesn't, take the first `pending` subtask, or the no-subtasks path. |
| **Step 1.3** — propose a bundle slug, let the user adjust | Derive it from the combined outcome and use it. No confirmation. |
| **Step 1.4** — ask whether to continue or restart an existing plan | Continue and fill gaps. Never discard a plan whose subtasks have advanced past `planned`. |
| **Step 2** — the structured Q&A rounds | **Settle each applicable category yourself** from the codebase and the upstream artifacts. See *Settling the technical decisions* below. |
| **Step 2** — "when unsure, ask one more round" | Read more code instead — the neighboring module, the existing contract, the test layout. Then decide and rate confidence honestly. |
| **Step 3** — present the outline and iterate until approved | Skip it. Go straight to writing the plan and updating `task-plan.md`. |
| **Step 7** — next-step line + clipboard copy | Return the stage report block from the autonomy contract instead. No `> **Next step:**` line, no clipboard, no invoking `/auto-implement`. |

Everything else stands: the work-item model, the Step 1 codebase exploration,
the full plan template (Target Structure as an ASCII tree, concrete Contracts,
ordered steps, scoped Acceptance Criteria, real Verification commands), the
`task-plan.md` status update, and the Step 6 self-review.

## Settling the technical decisions

Work the **same** category table the core skill lists — code placement, contract
shape, data model, error handling, edge cases, non-functional requirements,
integration points, sequencing, verification. Every applicable row still gets
settled; only the mechanism changes.

Source the answers in this order:

1. **Upstream artifacts are settled law.** `task-plan.md`'s Planning Notes and
   Definition of Done, `task-info.md`, and `decisions.md` entries from earlier
   stages are prior decisions. The core skill forbids re-litigating them, and
   that holds doubly here — you are the same pipeline that made them.
2. **The codebase decides placement and shape.** Find the analogous module and
   follow it: layering, naming, error handling, test location, the existing
   contract next door. This is the highest-value research you can do and it
   answers most of the table.
3. **Conventional defaults** only for what's genuinely unaddressed, flagged as a
   default in the decision entry.

**Log a decision entry** for each real choice: contract shape when more than one
was viable, placement when the repo admits two homes, error-handling stance, an
edge case you chose to handle or explicitly not to. Routine mechanics the
pattern next door dictates don't need one. **The automated/manual split in
Verification isn't a decision entry either** — it's written straight into the
plan's Verification section, which is its own complete record; a `decisions.md`
entry would just duplicate it.

**Contracts deserve the most care.** They're the spine `/auto-implement` builds
against and `/auto-review-implementation` measures against, and no human will
sanity-check the signature before code is written. A contract chosen between two
real alternatives is at best `Medium`; one that constrains code outside this
work-item is `Low`.

## Notes

- **Verification must be real and runnable.** `/auto-implement` runs these
  commands with nobody watching and treats green as permission to advance. A
  command that doesn't exist or a suite that doesn't cover the change turns the
  whole quality gate into theatre. Confirm the commands exist — check the
  `package.json` scripts, the Makefile, the CI config — before writing them down.
- **Manual verification still gets written.** `/auto-implement` can't perform
  most of it, but it reports the items as outstanding and the final report
  surfaces them to the human. Omitting them hides work rather than removing it.
- **Concrete beats vague, with no one to ask later.** "Handle errors
  appropriately" is a step `/auto-implement` will interpret however it likes.
  Name the failure mode, the surfaced message, the type.
- **Stay in scope.** One work-item's plan doesn't reach into another's. Scope
  bleed compounds across an unattended run, and the review that catches it is
  itself running unattended.
