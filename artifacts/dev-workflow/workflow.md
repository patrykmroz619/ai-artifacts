# Dev-Workflow — High-Level Design

A set of skills supporting a day-to-day, markdown-artifact-driven programming workflow.
Each skill is a discrete step; together they take a task from initialization to a finalized commit.
This document describes the **flow and contracts only** — not the final skill content.

The workflow is **two-grained**: a task can be broken into smaller **subtasks**, each of which is
independently planned in detail, implemented, reviewed, and committed. The subtask layer is
**optional** — small tasks skip it and flow straight through at the task level.

---

## Core concepts

### Artifacts root: `specs/`

`/init-workflow` creates a `specs/` directory at the repo root. It is the single source of
truth for all workflow artifacts and is committed to the repo (living documentation).

```
specs/
  coding-standards.md         # project coding standards (placeholder, filled manually)
  workflow-config.md          # workflow configuration (task mgmt, git conventions, changelog, ...)
  tasks/
    {task-name}/
      task-info.md            # source of truth about the task
      task-plan.md            # HIGH-LEVEL plan: subtask list + status (SoT) + overall DoD + planning notes
      implementation-plan.md  # ONLY in the no-subtasks path: detailed whole-task plan
      review.md               # task-level (cross-cutting) review
      subtasks/
        {subtask-name}/
          implementation-plan.md   # detailed plan for this subtask
          review.md                # per-subtask review
```

A **subtask** is a vertical, commit-sized chunk of the task: it is planned in detail, implemented,
reviewed, and committed on its own. The `subtasks/` folder only exists when `/plan-task` decides the
task is worth splitting.

### Two altitudes of planning

- **High-level plan** (`task-plan.md`, produced by `/plan-task`): the decomposition of the task into
  an ordered **subtask list** plus the overall definition of done. It is also the **single source
  of truth for subtask status**. If the task is small, it records "no subtasks" instead.
- **Detailed plan** (`implementation-plan.md`, produced by `/plan-implementation`): the concrete,
  step-by-step plan for a chosen **scope** — the whole task, a single subtask, or several subtasks at
  once. This is what `/implement` executes against.

There is **no separate decision log**. Durable planning context — decisions made, rejected
alternatives, constraints, risks, and codebase observations — is captured inline as **Planning Notes**
within the plan artifact it belongs to: task-level context in `task-plan.md`, scope-level context in
the relevant `implementation-plan.md`. One file per altitude, nothing to drift.

### Scope resolution (shared by plan-implementation / implement / review / finalize)

These skills operate on a **scope** — whole task, one subtask, or several subtasks — resolved in this order:

1. **Explicit argument** — subtask name(s) passed to the skill, or `--task` for whole-task scope. Wins.
2. **Next pending subtask** — the first unchecked entry in `task-plan.md`.
3. **No-subtasks path** — if the task has no subtasks, fall through to the whole-task `implementation-plan.md`.
4. **Ask the user** — if the scope is still ambiguous.

The **task itself** is resolved as before: explicit task argument > current git branch inference >
ask the user. Branches map to the **task**, not to subtasks.

### Subtask status in `task-plan.md`

`task-plan.md` lists each subtask as a heading carrying its slug and a phase tag, which the per-scope
skills advance as work progresses:

```
### 1. `subtask-a` — pending
### 2. `subtask-b` — planned        (set by /plan-implementation)
### 3. `subtask-c` — implemented    (set by /implement)
### 4. `subtask-d` — reviewed       (set by /review)
### 5. `subtask-e` — committed      (set by /finalize)
```

Each heading is followed by a short description of that subtask. This is the only place subtask status
lives — no separate ledger to drift.

### Configuration-driven integrations

`workflow-config.md` records _how_ the agent integrates with external systems, captured during init:

- **Task management** (Jira / Linear / GitHub Issues / none) and the access mechanism (MCP server, CLI such as `gh`, or manual).
- **Git conventions** (branch naming, commit style).
- **Changelog** practice (maintained or not, file location/format).

Skills read this file to decide whether to auto-fetch task data, propose branch names, prompt for changelog entries, etc. When an integration is configured but unavailable, skills degrade gracefully to manual input.

---

## Steps / Skills

### 1. `/init-workflow` — Initialize the workflow

**Purpose:** Set up the `specs/` artifacts root and capture project-level workflow configuration.

**Produces / modifies:**

- Creates `specs/` with `coding-standards.md` (placeholder), `workflow-config.md`, and an empty `tasks/` dir.

**How it works:**

1. Create the directory structure if absent (idempotent — never clobber existing files).
2. Interview the user to fill `workflow-config.md`:
   - Which task management system (if any) and the integration mechanism.
   - For the chosen system, **verify availability** — check for the required MCP server or CLI (e.g. Jira/Linear MCP, `gh` CLI). If missing, ask the user to configure one of the supported options and record the choice.
   - Git branch/commit conventions; changelog practice.
3. Leave `coding-standards.md` as a placeholder for manual completion (point the user to it).

---

### 2. `/start-task` — Start a task

**Purpose:** Create a task workspace and (optionally) a branch.

**Produces / modifies:**

- Creates `specs/tasks/{task-name}/task-info.md`.
- Optionally creates a git branch.

**How it works:**

1. Determine the task name from the user's short description. If input is empty/unclear, ask what they want to work on — or, if a task management system is configured, ask for a task identifier.
2. Gather task details: pull from the configured task management system when available (per `workflow-config.md`), otherwise from user input.
3. Write `task-info.md` as the task's source of truth (title, id/link, description, any acceptance hints).
4. Propose a branch (name following conventions in `workflow-config.md` / rules). Offer: accept proposed name, edit it, or skip branch creation.

---

### 3. `/plan-task` — Plan the task (high level)

**Purpose:** Produce a high-level plan: decompose the task into subtasks (or decide it needs none),
plus the overall definition of done — through iterative dialogue.

**Reads:** `task-info.md`, `coding-standards.md`, relevant codebase context.
**Produces / modifies:** `task-plan.md` in the task dir.

**How it works:**

1. **Analyze the codebase first** to understand the context of the task — this drives better questions and a better breakdown.
2. Run an **iterative Q&A loop**:
   - Ask a _small_ set of questions per iteration (later questions may depend on earlier answers — don't overload).
   - Keep track of the durable context the answers produce — it becomes the **Planning Notes** section of `task-plan.md`.
   - Repeat until the agent judges the breakdown and acceptance criteria are ready.
3. Write `task-plan.md`:
   - The **overall acceptance criteria / definition of done** for the task.
   - Either an ordered **subtask list** (each heading `pending`), or an explicit **"no subtasks"** note when the task is small enough to handle in one pass.
   - **Planning Notes** capturing the durable context from the Q&A loop.
4. This is high-level only — no per-subtask implementation steps yet (those come from `/plan-implementation`).

---

### 4. `/plan-implementation` — Plan the implementation (detailed, flexible scope)

**Purpose:** Turn the high-level plan into an actionable, step-by-step plan for a chosen scope.

**Scope:** whole task (no-subtasks path), a single subtask, or several subtasks at once — resolved per
**Scope resolution** above.

**Reads:** `task-plan.md` (incl. its Planning Notes), `task-info.md`, `coding-standards.md`, relevant codebase context.
**Produces / modifies:**

- **No-subtasks path:** `implementation-plan.md` at the task root.
- **Subtask scope:** writes an `implementation-plan.md` into **each** covered subtask folder.

**How it works:**

1. Resolve the active task and scope.
2. Run a focused Q&A loop as needed; capture the resulting decisions inline as **Planning Notes** within the relevant `implementation-plan.md`.
3. Write the detailed plan: an ordered list of implementation steps **plus the acceptance criteria** for that scope.
4. For a **multi-subtask** iteration, run a **single coherent planning session** but write one plan file per covered subtask, cross-referenced as the same iteration so they stay consistent.
5. Advance the status of each covered subtask in `task-plan.md` to `planned`.

---

### 5. `/implement` — Implement (flexible scope)

**Purpose:** Carry out the detailed plan in code.

**Scope:** same resolution as above — whatever was planned (whole task, one subtask, or several).

**Reads:** the relevant `implementation-plan.md`(s) (incl. their Planning Notes), `coding-standards.md`, repo rules.
**Produces / modifies:** source code changes (no workflow artifact of its own).

**How it works:**

1. Resolve the active task and scope, and load the corresponding detailed plan(s).
2. Implement following the plan, coding standards, and repo rules. For a multi-subtask scope, read all covered subtask plans.
3. Advance the status of each covered subtask in `task-plan.md` to `implemented`.
4. Finish with a **short summary of what was done**, then wait for user feedback and suggestions before considering the step complete.

---

### 6. `/review` — Review (flexible scope)

**Purpose:** Independent review of the changes against the plan and standards.

**Scope:** a subtask (or several) by default, or the whole task (`--task`) for a cross-cutting review.

**Reads:** code changes (diff), the relevant `implementation-plan.md` (incl. acceptance criteria) and
`task-plan.md` (overall DoD, incl. Planning Notes), `coding-standards.md`, repo rules.
**Produces / modifies:**

- **Subtask scope:** `review.md` in each covered subtask folder.
- **Task scope:** `review.md` at the task root.

**How it works:**

1. Analyze the code changes for adherence to coding standards and repo rules.
2. Verify the implementation realizes the plan and satisfies the acceptance criteria / definition of done for the scope.
3. Write findings, suggestions, and quality improvements to the scoped `review.md` (report captured as an artifact; the user decides what to act on). A follow-up `/implement` pass can address them.
4. Advance the status of each covered subtask in `task-plan.md` to `reviewed`.

---

### 7. `/finalize` — Finalize (flexible, self-detecting)

**Purpose:** Commit the current increment and, when the task is complete, wrap it up (changelog, PR).

**Reads:** `workflow-config.md`, `task-plan.md`, task artifacts, git working tree.
**Produces / modifies:** a git commit; on task completion, a changelog entry (folded into that commit) and PR/wrap-up.

**How it works:**

1. **Determine the increment** from modified files + `task-plan.md` status (which subtask(s) just got implemented/reviewed). If there are changes beyond the resolved scope, ask whether to commit only scope-related changes or everything.
2. **Detect whether this completes the task** — i.e. all other subtasks are already `committed` and no subtasks remain pending, or this is the whole-task / no-subtasks path:
   - **Not the last** → commit just this increment and set its subtask heading(s) to `committed`.
   - **Last / whole task** → if changelog is practiced (per `workflow-config.md`), add the entry and **include it in this same commit**, then proceed to PR / wrap-up.
3. Suggest a commit message (following configured conventions). Offer: proceed as-is, edit, or skip committing.

---

## Flow summary

```
/init-workflow ──> specs/ + workflow-config.md            (once per project)
        │
        v
/start-task ─────> specs/tasks/{task}/task-info.md  (+ branch)
        │
        v
/plan-task ──────> HIGH-LEVEL plan: subtask list + status (SoT) + DoD + planning notes
        │          (or marks the task as "no subtasks")  [iterative Q&A]
        │
        v
 ┌─── per iteration (scope = whole task | one subtask | several subtasks) ───┐
 │                                                                            │
 │  /plan-implementation ─> detailed plan (+ planning notes) for the scope     │
 │           │                                                                │
 │           v                                                                │
 │  /implement ──────────> code changes + summary; status → implemented       │
 │           │                                                                │
 │           v                                                                │
 │  /review ─────────────> review.md (subtask- or task-scoped)                │
 │           │              (may loop back to /implement)                     │
 │           v                                                                │
 │  /finalize ───────────> commit the scope; status → committed               │
 │                          (on the last subtask: + changelog in commit + PR) │
 └────────────────────────────────────────────────────────────────────────────┘
        │  (repeat until all subtasks committed)
        v
     task done (final /finalize handled changelog + PR/wrap-up)
```

## Open questions / future

- Packaging as an installable registry scope (`artifacts/dev-workflow/`) is **deferred** — design only for now.
- `coding-standards.md` content and templates are out of scope for this design.
