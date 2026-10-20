---
name: implement
description: Use after /plan-implementation, when a work-item's implementation-plan.md is ready to be carried out in code. Resolves the scope to its plan, implements the ordered steps against the stated contracts and coding standards, runs the plan's automated verification until green, records any material deviation back into the plan, and advances the covered subtasks to "implemented" in task-plan.md. Run before /review-implementation.
---

# /implement — Carry out the plan in code

Execute the approved `implementation-plan.md` for a resolved **work-item** — the whole task, a single subtask, or several subtasks bundled together. This is a **doing** skill, not a planning one: it follows the contracts and ordered steps the plan already settled, runs the plan's automated checks until they pass, records any material deviation back into the plan, then advances the covered subtasks to `implemented`. It does not re-plan; reopening a settled decision means going back to `/plan-implementation`.

**Reads:** the work-item's `implementation-plan.md` (Target Structure, Contracts, Steps, Acceptance Criteria, Verification), `specs/tasks/{task}/task-plan.md` (Definition of Done), `specs/workflow-config.md` (Coding standards and applicable operation/verification), repo rules, and the real source files the plan names.
**Produces:** source code changes; status updates in `task-plan.md`; and, only when the implementation departs materially from the plan, a short `## Implementation Notes` section appended to that work-item's `implementation-plan.md`.

Read [workflow integrity](../plan-task/references/workflow-integrity.md), including
verification snapshots and preservation of mixed/staged changes. The bundled
[snapshot helper](scripts/verification-snapshot.mjs) computes working-tree and
candidate-index fingerprints without changing the real index or working files.

## Documentation lookup

Prefer Context7 when implementation depends on dependency APIs, integration setup,
configuration, or version-sensitive behavior. Inspect manifests/lockfiles and target the
version in use. Check session tool availability; recorded workflow-config status is only a
starting point. Use `resolve-library-id` unless a suitable ID is already known, then
`query-docs` with a focused question. Reuse relevant documentation from the plan or current
context; skip routine edits needing no external docs. If Context7 is unavailable,
insufficient, or lacks matching-version docs, consult official documentation and note
material uncertainty rather than blocking or installing tools. Put supporting links and
version caveats in existing Implementation Notes when they explain a material deviation;
documentation lookup does not authorize changing the approved contracts.

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
2. Read `task-plan.md`'s **Definition of Done** for the covered subtasks, `specs/workflow-config.md`'s Project map, Coding standards, and applicable local operation, verification, and diagnostics sections, and repo rules (`CLAUDE.md` / `AGENTS.md` / `.cursor/rules`). Check configured commands and prerequisites against current project files before use; if a configured capability is unavailable, report the actual blocker rather than assuming it still works.
3. **Re-read the actual files the plan names** with Read/Glob/Grep. Build against current reality — the codebase may have moved since the plan was written. If it has moved enough that a step no longer makes sense, that is a deviation to surface (Step 4), not something to silently route around.
4. Before source edits, record starting HEAD/branch and pre-existing staged,
   unstaged, and untracked changes in the plan, including mixed files. Preserve
   that baseline on resume; reconstruct missing ownership or stop if unsafe.

### Step 3: Implement the steps in order

Work through the plan's **Implementation Steps** in sequence:

- Honor the **Contracts** exactly — signatures, schemas, routes, and types are the spine other work and `/review-implementation` depend on. Don't drift from them.
- Match the surrounding code's idiom, naming, layering, and error handling. Write code that reads like the code already there.
- Treat decisions in the plan's Planning Notes and in `task-plan.md` as settled. This skill does not re-litigate **whether** — only carries out **how**.
- Absorb small reality-vs-plan gaps inline (a renamed helper, an extra import, an obvious adjustment). These don't need a pause.
- **Pause and ask** (`AskUserQuestion`) only when a step is genuinely **blocked** or the code **contradicts** the plan in a way that changes the approach — not for routine choices the plan or codebase already answers.

### Step 4: Verify — run, fix, report

1. Capture the source fingerprint, then run the plan's **Automated** verification and repository-required checks. Capture the fingerprint again afterward; changed inputs require reassessment and affected checks to rerun.
2. **Fix failures you introduced** and re-run, looping until the checks are green or you hit a genuine blocker (an environment problem, a pre-existing failure unrelated to this work, or a contradiction that needs the user).
3. **Never silently skip a red check.** If something is still failing at the end, report it with the actual output and say why — a pre-existing failure, a blocked dependency, or a real defect to address.
4. Note the plan's **Manual** verification items as required/optional and PASS/FAIL/NOT EXERCISED. Use configured access to perform checks when possible; preserve the user's manual acceptance gate and never infer a pass from source inspection.
5. **Write the result to the plan** — append an attempt to `## Verification Log` on **this work-item's** `implementation-plan.md`, preserving earlier attempts:

   ```markdown
   ## Verification Log

   **Attempt:** V1 — [actual UTC time and environment]
   **Tested HEAD:** [actual revision]
   **Source fingerprint:** [algorithm, before/after digest, exclusions, relevant ignored-input digests]
   **Automated:** [actual commands, exit codes, results, evidence paths, acceptance coverage]
   **Manual:** [required/optional checks with PASS/FAIL/NOT EXERCISED and evidence]
   ```

   Use the actual commands run and their outcome — including a still-red check, named honestly,
   with why. Review reuses this evidence only when its inputs remain valid; stale
   or missing evidence requires verification rather than trust in a date or phase.

### Step 5: Record material deviations (only if any)

If the implementation departed **materially** from the plan — a contract had to change, a step was done differently, a file moved, an approach was swapped — append a short section to **this work-item's** `implementation-plan.md`:

```markdown
## Implementation Notes

- [What changed vs. the plan, and why. One bullet per material deviation — concise, not a diary.]
```

These notes are co-located with the plan so review sees them. **Skip the section entirely** when the implementation followed the plan — don't add an empty or trivial note.

### Step 6: Update task-plan.md

Prepare the following update, but write it only after Step 7 finishes and required
automated checks pass on the final source snapshot. Advance each covered subtask
`planned → implemented`, preserving its work-item annotation:

```
### 2. `migrate-user-table` — implemented (work-item: `data-layer`)
### 3. `backfill-script` — implemented (work-item: `data-layer`)
```

For the no-subtasks path, advance `**Phase:** planned → implemented` in
`task-plan.md`. For a whole-task work-item covering subtasks, advance all covered
headings together. Do not advance on failing required automated checks. Source
edits during Step 7 invalidate affected evidence and require Step 4 again before
writing the phase update.

### Step 7: Self-review

Read the changes against the plan with fresh eyes and fix issues inline before handing off:

1. Every file in **Target Structure** is actually created/modified, and nothing landed outside it (no scope bleed into another work-item).
2. The **Contracts** are realized exactly as specified.
3. The **Acceptance Criteria** for this scope are met.
4. No leftover placeholders, debug code, `TODO`s, or commented-out blocks.
5. The plan's automated checks are green (or remaining failures are reported and explained).

After any self-review fix, rerun affected checks and append a fresh verification
attempt. Keep the phase at `planned` until required automated checks pass on the
final source snapshot; a report of a red check is not a passing gate.

### Step 8: Summarize and request feedback

Print a tight status block:

```text
<files changed>            [created | modified]
task-plan.md               subtasks → implemented: a, b
Checks: <cmd> ✓  <cmd> ✓   Deviations: <n recorded, or none>
```

`Checks:` mirrors what Step 4.5 just wrote to the plan's `## Verification Log` — the log is the
artifact that matters; this line is just the human-readable echo of it.

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

Once the user has accepted, resolve the exact next command — `/review-implementation {task-name}
{subtask-slug(s)}` for the covered subtask(s), or `/review-implementation {task-name}` (no
`--task` needed) on the no-subtasks path — and copy it to the clipboard (best-effort:
`Set-Clipboard`/`pbcopy`/`xclip`). Close with the next step and stop — don't chain automatically.
Put the bolded **(copied to clipboard)** right after the command, only if the copy succeeded:

> **Next step:** run `/review-implementation add-oauth-login data-layer` **(copied to clipboard)** to check this work against the plan, acceptance criteria, and coding standards.

## Notes

- **Doing, not planning.** No Q&A loop. Execute the approved plan and ask only when a step is blocked or contradicted. If a decision genuinely needs reopening, that's a trip back to `/plan-implementation`, not improvisation here.
- **Build against current code.** The plan is a snapshot; the repo is the truth. Re-read the files the plan names before changing them.
- **Contracts are the spine.** Implement signatures, schemas, and routes exactly as planned — neighboring work and `/review-implementation` depend on them.
- **Self-verify before claiming done.** A subtask becomes `implemented` only after the plan's automated checks pass; report anything still red instead of hiding it.
- **Two plan sections, different rules.** Append actual verification attempts with source fingerprints; reuse only valid evidence. `## Implementation Notes` is only for material deviations.
- **Status lives in task-plan.md.** This skill advances covered subtasks `planned → implemented`; `/review-implementation` and `/finalize` carry them onward. There is no separate ledger.
- **The user accepts, not the agent.** Automated checks passing is necessary but not sufficient. After implementing, request manual verification and feedback, and iterate until the user explicitly signs off. Don't self-certify and move on.
- **No auto-chain.** Once accepted, point to `/review-implementation` and stop. Copying the resolved command to the clipboard is a convenience, not an invocation — never run the next skill yourself.
