---
name: auto-plan-task
description: Autonomous counterpart to /plan-task, for unattended /autopilot runs. Writes task-plan.md — Definition of Done plus the subtask breakdown — by answering the core skill's coverage checklist from codebase evidence instead of brainstorming with the user, and skipping the approval gate. Dispatched by /autopilot; not meant to be run by hand (use /plan-task when a human is present).
---

# /auto-plan-task — Plan the task (autonomous)

**Derived from:** `../plan-task/SKILL.md` — read it in full and follow it
exactly, **except** where the Overrides table below replaces a step.
**Autonomy contract:** `../autopilot/assets/autonomy-contract.md` — read it too.

You have no user. `AskUserQuestion` is unavailable, nobody will see a question,
and there is no approval to wait for. The core skill's brainstorm loop and its
strict approval gate are the two things this skill replaces — everything else
about how a good `task-plan.md` is written still binds you.

## Overrides

| Core step | Autonomous replacement |
| --- | --- |
| **Step 1.4** — ask whether to continue or restart a resumed plan | Continue from the existing `task-plan.md`, filling gaps. Never restart and never overwrite a plan whose subtasks have already advanced past `pending`. |
| **Step 2** — the brainstorm loop of `AskUserQuestion` rounds | **Answer the coverage checklist yourself**, from the Step 1 codebase exploration and `task-info.md`. See *Answering the checklist* below. |
| **Step 2** — "when unsure, ask one more round" | When unsure, **do one more round of research** — read more code, find the neighboring pattern — then decide and rate your confidence honestly. Uncertainty converts into a `Low` entry, not a question. |
| **Step 3** — present the breakdown and iterate until the user approves | Skip the approval message entirely. Run the **merge pass** and the self-check on granularity, then go straight to writing. |
| **Step 6** — next-step line + clipboard copy | Return the stage report block from the autonomy contract instead. No `> **Next step:**` line, no clipboard, no invoking `/auto-plan-implementation`. |

Everything else stands, and most of it matters more here than usual: the Step 1
codebase exploration, the merge pass, the subtask-granularity rules, the
"no subtasks" heuristics, both artifact templates, and the Step 5 self-review.

## Answering the checklist

Sweep the **same** coverage checklist the core skill lists — scope, solution
approach and its rejected alternatives, edge cases, non-functional needs, risks
and unknowns, dependencies, Definition of Done, decomposition. Nothing is
dropped because there's no one to ask; each dimension is settled or explicitly
judged not-applicable, same as before.

The difference is where the answers come from:

1. **`task-info.md` first.** Anything the task brief settles is a prior decision.
   The core skill's "don't make the user repeat themselves" becomes "don't
   re-derive what you were told" — and never contradict the brief silently. If
   the brief looks wrong, follow it and log the tension.
2. **The codebase second.** An established pattern in the repo answers most
   approach questions on its own, and it answers them better than a guess. The
   core skill's rule that recommendations come from research, not guessing, is
   now the *only* thing keeping the plan honest.
3. **Conventional defaults last**, and only for genuinely open dimensions —
   named as such in the decision entry, not dressed up as evidence.

**Log a decision entry** for each dimension where a real choice existed —
the approach chosen and what you rejected, any non-functional stance, any
assumption filling a gap in the brief. Dimensions the brief or the codebase
answered outright don't need one. **The decomposition itself isn't a decision
entry** — the subtask list in `task-plan.md` (or the "no subtasks" note) is
already its own record; a `decisions.md` entry would just restate it. The
`Alternatives considered` field is where the brainstorm's value survives: it's
what a human reads later to see the road not taken.

**Rate architecture-shaping calls honestly.** The approach decision is the one
call logged here that constrains everything downstream. If it was a close call
between real options, that's `Low` — and a `Low` here is cheap, because the
coordinator's sanity check runs before any code is written.

## Notes

- **Fewer, larger subtasks — this matters more without a human.** Each subtask
  costs a full plan → implement → review → triage → finalize cycle running
  unattended. The core skill's default-to-merging rule and its "5+ is a signal to
  re-check" both bite harder here. When genuinely torn between one subtask and
  two, take one.
- **Prefer the no-subtasks path when it honestly fits.** A task that can be
  reviewed and committed in one pass runs faster and drifts less.
- **Still high-level.** No implementation steps. `/auto-plan-implementation`
  needs a real decomposition to work from, not a pre-empted plan.
- **Planning Notes carry the run.** Every later stage is a fresh agent that
  never saw your reasoning. Planning Notes plus `decisions.md` are the entire
  inheritance — write them for a stranger.
- **Don't invent scope.** The brief bounds the task. An autonomous planner that
  "improves" the goal produces work nobody asked for, and nobody is watching to
  stop it. The Out of scope / Non-goals line is a real constraint on you.
