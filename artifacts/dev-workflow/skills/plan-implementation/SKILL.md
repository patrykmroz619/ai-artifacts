---
name: plan-implementation
description: Use after /plan-task, when a chosen scope (one subtask, several subtasks, or the whole task) needs a precise, technical implementation plan before coding. Resolves the scope into a work-item, runs a structured Q&A to settle code placement, contracts, and edge cases, then writes one implementation-plan.md and advances the covered subtasks to "planned" in task-plan.md. Run before /implement.
---

# /plan-implementation — Plan the implementation (detailed, technical)

Turn the high-level `task-plan.md` into one precise, actionable `implementation-plan.md` for a chosen **scope** — the whole task, a single subtask, or several subtasks bundled together. This is the plan `/implement` executes against, so it carries the technical decisions: which files and folders change, where new code lives, what contracts are introduced or modified, and how the result is verified.

**Reads:** `specs/tasks/{task}/task-plan.md` (incl. Planning Notes + Definition of Done), `specs/tasks/{task}/task-info.md`, `specs/workflow-config.md` (Coding standards), relevant codebase context.
**Produces:** one `implementation-plan.md` (location depends on scope, see below) and status/annotation updates in `task-plan.md`.

## The work-item model

A **subtask** is a logical slice recorded in `task-plan.md` — it carries decomposition and status, but it is not a folder. A **work-item** is the unit this skill plans and the unit `/implement`, `/review-implementation`, and `/finalize` operate on. A work-item covers **one subtask, several subtasks, or the whole task**, and it always produces **exactly one** `implementation-plan.md`.

```
specs/tasks/{task}/
├── task-info.md
├── task-plan.md # subtask list + status (SoT) + DoD + planning notes
├── implementation-plan.md # ONLY the no-subtasks / whole-task path (flat, at root)
└── work-items/
    └── {work-item-slug}/
        ├── implementation-plan.md # the ONE detailed plan for this work-item
        └── review.md # later, from /review-implementation
```

**Status stays per-subtask** in `task-plan.md`. A work-item advances the status of **all** subtasks it covers, together, and annotates each with its work-item slug:

```
### 2. `migrate-user-table` — planned (work-item: `data-layer`)
### 3. `backfill-script` — planned (work-item: `data-layer`)
```

The plan's own header lists the subtasks it covers — that is the two-way link that lets downstream skills resolve a subtask to its plan.

**Planning contract:** resolve the scope, explore the codebase, settle the technical decisions through structured Q&A (clustering related questions into short rounds), get approval for the outline, then write the plan and update `task-plan.md`. Do not write `implementation-plan.md` or touch `task-plan.md` until the user approves the proposed steps, affected files, and contracts.

## Process

### Step 1: Resolve scope and read context

1. **Resolve the task:** explicit task argument > inference from the current git branch > ask the user. Confirm `specs/tasks/{task}/task-plan.md` exists — if it doesn't, stop and point the user to `/plan-task`.
2. **Resolve the scope → work-item**, in order:
   - **Explicit argument** — subtask name(s) passed to the skill, or `--task` for whole-task scope. Wins.
   - **Next pending subtask** — the first subtask still `pending` in `task-plan.md`.
   - **No-subtasks path** — if `task-plan.md` declares no subtasks, plan the whole task.
   - **Ask the user** if the scope is still ambiguous.
3. **Determine the work-item identity:**
   - One subtask → reuse its slug as the work-item slug.
   - Several subtasks → propose a short bundle slug describing the combined outcome; let the user adjust.
   - Whole task / no-subtasks → no work-item folder; the plan goes to the task root.
4. **Check for an existing plan** at the resolved location. If one exists, this is a resumed run: show its current state and ask whether to continue from where it left off or restart.
5. **Read context:** `task-plan.md` fully — the Definition of Done and Planning Notes for the covered scope are prior decisions, not things to re-ask. Read `task-info.md` and `specs/workflow-config.md`'s Coding standards section if present.
6. **Explore the codebase** with Glob and Grep: find the exact files, modules, and patterns the scope will touch. Look for the conventions this work-item must follow — naming, layering, error handling, test layout, existing contracts nearby.

Summarize findings in 3–5 bullets before asking anything: which files this work-item will touch, the patterns to follow, and any complexity signals. Don't ask the user what the codebase already answers.

### Step 2: Structured Q&A — settle every technical decision

Work in short, focused rounds. **Group 2–3 tightly related questions into one round** when they share context (e.g. placement + layering + naming for the same module); keep unrelated decisions in separate rounds. Prefer multiple choice when it helps the user decide; use open-ended questions only when the answer space is genuinely unknown. After each round, capture the durable decision and look for the next gap.

This altitude is about **HOW**, not whether. Decisions already made in `task-plan.md`'s Planning Notes or Definition of Done are settled — do not re-litigate them. Ask only what the codebase can't answer and the plan genuinely needs.

**Coverage checklist — sweep all applicable rows below before you propose the outline.** Don't stop at the first plan you *could* write; keep going until each relevant technical decision is settled. **When unsure whether you've covered enough, ask one more round** — err toward more questions, not fewer.

**Question categories to draw from:**

| Category                                                        | Tag |
| --------------------------------------------------------------- | --- |
| Code placement — where new files/modules live, how to layer     | [S] |
| Contract / interface shape — signatures, schemas, types, routes | [S] |
| Data model — tables, fields, relationships, migrations          | [S] |
| Error handling — failure modes, retries, surfaced messages      | [S] |
| Edge cases — boundaries and failure modes to handle explicitly  | [S] |
| Non-functional requirements — perf, security, UX, compat        | [S] |
| Integration points — what this calls and what calls it          | [S] |
| Sequencing within the work-item — ordering, dependencies        | [S] |
| Verification — which checks to automate vs verify manually      | [S] |

**Rules:**

- One round per AskUserQuestion call — up to 3 tightly related questions, 2–4 options each. Split unrelated decisions across rounds.
- For approach / tradeoff questions: mark exactly one option `⭐ Recommended`, and format options as `[What this does.] · Strength: [advantage] · Tradeoff: [cost]`. Ground recommendations in codebase research — not guessing.
- Don't re-ask anything `task-plan.md`, `task-info.md`, or coding standards already settle.
- After each round, check the coverage checklist: any applicable row still open → ask about it next. Move to Step 3 only once every relevant decision is settled.

**After each answer**, keep track of the decisions, constraints, rejected alternatives, and codebase observations that the plan or future workflow steps will need. These become the concise **Planning Notes** of the plan — not a transcript.

### Step 3: Propose the outline and get approval

Present a concise approval summary before writing anything:

- The **affected files** (create / modify, one line each).
- The **contract changes** — new or modified interfaces, signatures, schemas, or routes.
- The **ordered implementation steps** as one-liners.
- The **verification approach** (what's automated, what's manual).

Keep it tight — this is for alignment, not the final artifact. Don't mirror the full template here.

Then, **in a plain message** (not an `AskUserQuestion`), invite the user to respond: reply to adjust the steps, contracts, or a decision — or say go and you'll write the plan. Let the user answer in free text. Iterate until approved. The gate is strict: **no `implementation-plan.md` write and no `task-plan.md` edit until the user approves the steps, affected files, and contracts.**

### Step 4: Write the implementation plan

Write to the resolved location:

- **Subtask scope:** `specs/tasks/{task}/work-items/{work-item-slug}/implementation-plan.md`
- **No-subtasks / whole-task:** `specs/tasks/{task}/implementation-plan.md` (flat, at root)

```markdown
# Implementation Plan: [Work-item / scope title]

**Scope:** work-item `{slug}` covering subtasks `a`, `b`   (or: whole task — no subtasks)
**Part of:** specs/tasks/{task}/task-plan.md

## Goal

[1–3 sentences: what this work-item delivers and why. The narrow objective of this scope, not the whole task.]

## Planning Notes

[Optional. Scope-level durable context from the Q&A: technical decisions made, rejected alternatives when the reason matters, constraints, risks, and codebase observations the implementer needs. Concise, not a transcript. Omit when Goal and the steps already say enough.]

## Architecture / Data Flow

[**Prefer diagrams over dense prose here.** Reach for one or more Mermaid diagrams whenever they clarify a data flow, business-logic branch, state transition, or component boundary — and include **more than one** when they cover different concerns (e.g. a sequence diagram for a request flow *and* an ERD for the data model). Pick the types that fit: flow, sequence, state, component/dependency, ERD. Mermaid is for relationships and flows; the file layout lives in **Target Structure** as an ASCII tree, not here. Omit this section only for trivial, linear work where a diagram would be decorative.]

## Target Structure

[Show the files and folders this work-item creates or modifies as an **ASCII tree in a fenced code block**, so the hierarchy is visible at a glance — not a flat list. Tag each node `[create]` or `[modify]`, include new directories as tree nodes, and give one line of responsibility each.]

```
src/
  auth/
    jwt.ts            [create]  issue + verify access/refresh tokens
    middleware.ts     [modify]  wire in the verifyAccess guard
  routes/
    login.ts          [create]  POST /login, returns a token pair
```

## Contracts

[New or changed interfaces, function signatures, schemas, types, routes, or events — shown concretely enough that the implementer and any neighboring work know the exact shape. Omit this section when the work-item introduces or changes no contract.]

## Implementation Steps

[Ordered, technical steps. Each step names what changes, in which file(s), and against which contract. Include a code snippet only when the change is non-obvious — a tricky algorithm, an unusual API call, a counterintuitive ordering, or a signature other steps depend on. For routine edits, describe the intent and the contract and stop.]

1. [Step]
2. [Step]

## Acceptance Criteria

[Scoped Definition of Done — the subset of task-plan.md's overall DoD that this work-item is responsible for, written as **objective, testable statements** a reviewer can verify (optional EARS phrasing: "When <trigger>, the system shall <response>").]

## Verification

**Automated:** [Commands an agent can run — tests, lint, typecheck, build. Be specific.]
**Manual:** [Human checks — UI/UX behavior, real-world cases, anything not coverable by a command.]
```

### Step 5: Update task-plan.md

Edit `task-plan.md` to reflect that this scope is planned:

- For **each covered subtask**, advance its heading status `pending → planned` and annotate it with the work-item slug:
  `### 2. \`migrate-user-table\` — planned (work-item: \`data-layer\`)`
- For the **no-subtasks / whole-task** path, there is no per-subtask status to advance — the plan at the task root is the record.

Touch only the status and annotation on the covered headings. Leave the rest of `task-plan.md` — Definition of Done, Planning Notes, other subtasks — untouched.

### Step 6: Self-review the plan

Read the written `implementation-plan.md` with fresh eyes and fix issues inline:

1. Remove placeholders, TBDs, and vague language ("add appropriate error handling", "handle edge cases").
2. Check that every step names real files and that those files appear in **Target Structure**, which is rendered as an ASCII tree (not a flat list).
3. Check that contracts are concrete — exact signatures/schemas/routes, not "an interface for X".
4. Check that Acceptance Criteria are objective and testable, name observable outcomes, and stay within this work-item's scope.
5. Check that a diagram is present wherever a flow, boundary, or data shape would otherwise be dense prose.
6. Check that Verification commands are real and runnable, with a clear automated / manual split.
7. Check that the plan did not bleed into another work-item's scope.

### Step 7: Summarize and hand off

```text
work-items/{work-item-slug}/implementation-plan.md    [created]   (or: implementation-plan.md at task root)
task-plan.md                                          subtasks → planned: a, b

Steps: [N]   Contracts changed: [N]
```

Close with the next step and stop — don't chain automatically:

> **Next step:** run `/implement` to carry out this plan in code.

## Notes

- **Technical altitude.** This is where placement, contracts, and concrete steps live. `task-plan.md` owns the *what*; this plan owns the *how*. Don't restate the high-level breakdown — reference it.
- **One plan per work-item.** A scope spanning several subtasks produces a single `implementation-plan.md`, not one per subtask. The header lists the subtasks it covers; `task-plan.md` annotates each of them with the work-item slug.
- **Respect upstream decisions.** Treat `task-plan.md`'s Planning Notes and Definition of Done as settled. Q&A at this stage is for implementation decisions the codebase can't answer, not for re-opening the breakdown.
- **Contracts are the spine.** When a work-item introduces or changes an interface, show its exact shape — neighboring work and `/review-implementation` depend on it.
- **Code snippets are the exception.** Default to describing intent + contract + file. Add a snippet only when the change is genuinely non-obvious.
- **Prefer diagrams over dense prose.** Reach for Mermaid (flow, sequence, state, component/dependency, ERD) whenever a flow, boundary, or data shape would otherwise be a paragraph the reader has to reconstruct — and use more than one when they cover different concerns. Render the file layout as an ASCII tree in **Target Structure**, not as a diagram. Skip diagrams only for trivial, linear work.
- **Status lives in task-plan.md.** This skill advances covered subtasks to `planned`; downstream skills carry them to `implemented`, `reviewed`, `committed`. There is no separate ledger.
