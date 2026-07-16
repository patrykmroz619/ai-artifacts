---
name: implement
description: Use after /plan-implementation, when a work-item's implementation-plan.md is ready to be carried out in code. Resolves the scope to its plan, implements the ordered steps against the stated contracts and coding standards, runs the plan's automated verification until green, records any material deviation back into the plan, and advances the covered subtasks to "implemented" in task-plan.md. Run before /review-implementation.
---

# /implement — Carry out the plan in code

Execute the approved `implementation-plan.md` for a resolved **work-item** — the whole task, a single subtask, or several subtasks bundled together. This is a **doing** skill, not a planning one: it follows the contracts and ordered steps the plan already settled, runs the plan's automated checks until they pass, records any material deviation back into the plan, then advances the covered subtasks to `implemented`. It does not re-plan; reopening a settled decision means going back to `/plan-implementation`.

**Reads:** the work-item's `implementation-plan.md` (Target Structure, Contracts, Steps, Acceptance Criteria, Verification), `specs/tasks/{task}/task-plan.md` (Definition of Done), `specs/workflow-config.md` (Coding standards), repo rules, and the real source files the plan names.
**Produces:** source code changes; status updates in `task-plan.md`; and, only when the implementation departs materially from the plan, a short `## Implementation Notes` section appended to that work-item's `implementation-plan.md`.

## The work-item model

A **work-item** is the unit `/plan-implementation` planned and the unit this skill executes: one subtask, several subtasks, or the whole task, with **exactly one** `implementation-plan.md`. Status stays per-subtask in `task-plan.md`; a work-item advances the status of **all** the subtasks it covers, together.

```
specs/tasks/{task}/
├── task-plan.md # subtask list + status (SoT) + DoD + planning notes
├── implementation-plan.md # no-subtasks / whole-task path (flat, at root)
└── work-items/
    └── {work-item-slug}/
        └── implementation-plan.md # the ONE plan this skill executes
```

**Execution contract:** resolve the scope to its plan, build against the current code (not the plan's snapshot), follow the contracts exactly, run the automated checks until green or genuinely blocked, then advance status. Don't claim a subtask is `implemented` until the plan's automated verification passes.

## Process

### Step 1: Resolve task and scope, load the plan

1. **Resolve the task:** explicit task argument > inference from the current git branch > ask the user. Confirm `specs/tasks/{task}/task-plan.md` exists — if not, stop and point to `/plan-task`.
2. **Resolve the scope → work-item**, in order:
   - **Explicit argument** — subtask name(s), or `--task` for whole-task scope. Wins.
   - **Next planned subtask** — the first subtask still `planned` in `task-plan.md` (not `pending`).
   - **No-subtasks path** — if `task-plan.md` declares no subtasks, the whole task is the scope.
   - **Ask the user** if the scope is still ambiguous.
3. **Locate the `implementation-plan.md`** for the resolved work-item:
   - Subtask scope → `specs/tasks/{task}/work-items/{work-item-slug}/implementation-plan.md` (read the subtask's work-item annotation in `task-plan.md` to find the slug).
   - No-subtasks / whole-task → `specs/tasks/{task}/implementation-plan.md`.
4. **Check status before doing anything:**
   - If the covered subtask is still `pending` (no plan yet) → stop and point to `/plan-implementation`.
   - If it is already `implemented` (or further) → say so and ask whether to redo it or move to the next pending work-item, rather than silently re-running.

### Step 2: Read context

1. Read the resolved `implementation-plan.md` in full: **Target Structure**, **Contracts**, **Implementation Steps**, **Acceptance Criteria**, and **Verification**. These are the spec for this run.
2. Read `task-plan.md`'s **Definition of Done** for the covered subtasks, `specs/workflow-config.md`'s Coding standards section, and repo rules (`CLAUDE.md` / `AGENTS.md` / `.cursor/rules`).
3. **Re-read the actual files the plan names** with Read/Glob/Grep. Build against current reality — the codebase may have moved since the plan was written. If it has moved enough that a step no longer makes sense, that is a deviation to surface (Step 4), not something to silently route around.

### Step 3: Implement the steps in order

Work through the plan's **Implementation Steps** in sequence:

- Honor the **Contracts** exactly — signatures, schemas, routes, and types are the spine other work and `/review-implementation` depend on. Don't drift from them.
- Match the surrounding code's idiom, naming, layering, and error handling. Write code that reads like the code already there.
- Treat decisions in the plan's Planning Notes and in `task-plan.md` as settled. This skill does not re-litigate **whether** — only carries out **how**.
- Absorb small reality-vs-plan gaps inline (a renamed helper, an extra import, an obvious adjustment). These don't need a pause.
- **Pause and ask** (`AskUserQuestion`) only when a step is genuinely **blocked** or the code **contradicts** the plan in a way that changes the approach — not for routine choices the plan or codebase already answers.

### Step 4: Verify — run, fix, report

1. Run the plan's **Automated** verification — the exact tests, lint, typecheck, and build commands it names (use Bash).
2. **Fix failures you introduced** and re-run, looping until the checks are green or you hit a genuine blocker (an environment problem, a pre-existing failure unrelated to this work, or a contradiction that needs the user).
3. **Never silently skip a red check.** If something is still failing at the end, report it with the actual output and say why — a pre-existing failure, a blocked dependency, or a real defect to address.
4. Note the plan's **Manual** verification items in the hand-off summary so the user knows what still needs a human check; don't mark them done yourself.

### Step 5: Record material deviations (only if any)

If the implementation departed **materially** from the plan — a contract had to change, a step was done differently, a file moved, an approach was swapped — append a short section to **this work-item's** `implementation-plan.md`:

```markdown
## Implementation Notes

- [What changed vs. the plan, and why. One bullet per material deviation — concise, not a diary.]
```

This is the single artifact `/implement` writes, and it is co-located with the plan so `/review-implementation` sees it for free. **Skip the section entirely** when the implementation followed the plan — don't add an empty or trivial note.

### Step 6: Update task-plan.md

Advance each covered subtask `planned → implemented` in `task-plan.md`, preserving its work-item annotation:

```
### 2. `migrate-user-table` — implemented (work-item: `data-layer`)
### 3. `backfill-script` — implemented (work-item: `data-layer`)
```

For the no-subtasks / whole-task path there is no per-subtask status to advance — the plan at the task root is the record. Touch only the status on the covered headings; leave the Definition of Done, Planning Notes, and other subtasks untouched.

### Step 7: Self-review

Read the changes against the plan with fresh eyes and fix issues inline before handing off:

1. Every file in **Target Structure** is actually created/modified, and nothing landed outside it (no scope bleed into another work-item).
2. The **Contracts** are realized exactly as specified.
3. The **Acceptance Criteria** for this scope are met.
4. No leftover placeholders, debug code, `TODO`s, or commented-out blocks.
5. The plan's automated checks are green (or remaining failures are reported and explained).

### Step 8: Summarize and request feedback

Print a tight status block:

```text
<files changed>            [created | modified]
task-plan.md               subtasks → implemented: a, b
Checks: <cmd> ✓  <cmd> ✓   Deviations: <n recorded, or none>
```

Then **explicitly hand the manual verification to the user and ask for feedback.** Don't treat the work as accepted just because the automated checks passed — list what the plan's **Verification → Manual** items expect, and ask the user to try them out:

> Implementation is in and automated checks pass. Before this is done, please verify manually:
> - [manual check 1 from the plan's Verification]
> - [manual check 2 …]
>
> Anything to change, or does this look good?

Deliver this as a **plain message**, not an `AskUserQuestion` — the user replies in free text (a comment, a failed check, or "looks good"). If the plan lists no manual checks, still ask the user to confirm the result is what they wanted.

### Step 9: Iterate until accepted

Loop on the user's response until they accept the work:

- **Feedback or a failed manual check** → make the changes, re-run the relevant **automated** checks (Step 4), update the **Implementation Notes** if a change is a material deviation (Step 5), then re-summarize and ask again. Stay in this loop — each pass ends by returning to the user, not by moving on.
- **A blocking question** → ask it, apply the answer, and continue iterating.
- **Explicit acceptance** ("looks good", "ship it", "accepted") → exit the loop and proceed to hand-off.

Only the user's acceptance ends this step. Don't self-certify and move on; the subtask is `implemented` in `task-plan.md`, but it isn't *done* with this skill until the user signs off.

### Step 10: Hand off

Once the user has accepted, close with the next step and stop — don't chain automatically:

> **Next step:** run `/review-implementation` to check this work against the plan, acceptance criteria, and coding standards.

## Notes

- **Doing, not planning.** No Q&A loop. Execute the approved plan and ask only when a step is blocked or contradicted. If a decision genuinely needs reopening, that's a trip back to `/plan-implementation`, not improvisation here.
- **Build against current code.** The plan is a snapshot; the repo is the truth. Re-read the files the plan names before changing them.
- **Contracts are the spine.** Implement signatures, schemas, and routes exactly as planned — neighboring work and `/review-implementation` depend on them.
- **Self-verify before claiming done.** A subtask becomes `implemented` only after the plan's automated checks pass; report anything still red instead of hiding it.
- **One artifact, only when warranted.** The sole thing this skill writes (beyond code and status) is an `## Implementation Notes` section appended to the plan, and only for material deviations.
- **Status lives in task-plan.md.** This skill advances covered subtasks `planned → implemented`; `/review-implementation` and `/finalize` carry them onward. There is no separate ledger.
- **The user accepts, not the agent.** Automated checks passing is necessary but not sufficient. After implementing, request manual verification and feedback, and iterate until the user explicitly signs off. Don't self-certify and move on.
- **No auto-chain.** Once accepted, point to `/review-implementation` and stop.
