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
├── workflow-config.md # workflow configuration (task mgmt, git conventions, changelog, coding standards, ...)
└── tasks/
    └── {task-name}/
        ├── task-info.md # source of truth about the task
        ├── task-plan.md # HIGH-LEVEL plan: subtask list + status (SoT) + overall DoD + planning notes
        ├── implementation-plan.md # ONLY the no-subtasks / whole-task path: detailed plan at task root
        ├── review.md # ONLY the no-subtasks / whole-task path: cross-cutting review at task root
        └── work-items/
            └── {work-item-slug}/
                ├── implementation-plan.md # the ONE detailed plan for this work-item
                └── review.md # the review report for this work-item
```

A **subtask** is a logical slice of the task recorded in `task-plan.md` — it carries the
decomposition and its status, but it is **not** a folder. A **work-item** is the unit the per-scope
skills actually operate on: it covers **one subtask, several subtasks, or the whole task**, lives in
its own `work-items/{slug}/` folder, and always holds **exactly one** `implementation-plan.md` (and
later one `review.md`). The `work-items/` folder only exists when `/plan-task` splits the task into
subtasks; the no-subtasks / whole-task path keeps its single plan and review flat at the task root.

### Two altitudes of planning

- **High-level plan** (`task-plan.md`, produced by `/plan-task`): the decomposition of the task into
  an ordered **subtask list** plus the overall definition of done. It is also the **single source
  of truth for subtask status**. If the task is small, it records "no subtasks" instead.
- **Detailed plan** (`implementation-plan.md`, produced by `/plan-implementation`): the concrete,
  step-by-step plan for a chosen **work-item** — the whole task, a single subtask, or several subtasks
  bundled together. There is **one** detailed plan per work-item, and it is what `/implement` executes
  against.

There is **no separate decision log**. Durable planning context — decisions made, rejected
alternatives, constraints, risks, and codebase observations — is captured inline as **Planning Notes**
within the plan artifact it belongs to: task-level context in `task-plan.md`, scope-level context in
the relevant `implementation-plan.md`. One file per altitude, nothing to drift.

### Scope resolution (shared by plan-implementation / implement / review-implementation / finalize)

These skills operate on a **work-item** — whole task, one subtask, or several subtasks — resolved in this order:

1. **Explicit argument** — subtask name(s) passed to the skill (mapped to their work-item), or `--task` for whole-task scope. Wins.
2. **Next subtask at the skill's inbound phase** — the first subtask in `task-plan.md` still at the status this skill consumes: `pending` for `/plan-implementation`, `planned` for `/implement`, `implemented` for `/review-implementation`, `reviewed` for `/finalize`. `/triage-findings` is the exception: it consumes `reviewed` subtasks whose `review.md` still has `Status: open` findings, and advances no status of its own.
3. **No-subtasks path** — if the task has no subtasks, fall through to the whole-task `implementation-plan.md` / `review.md` at the task root.
4. **Ask the user** — if the scope is still ambiguous (e.g. several subtasks share the inbound phase).

Once resolved, a subtask is mapped to its **work-item** via the `(work-item: \`slug\`)` annotation in
`task-plan.md`, so the skill finds the one `implementation-plan.md` / `review.md` that covers it.

The **task itself** is resolved as before: explicit task argument > current git branch inference >
ask the user. Branches map to the **task**, not to subtasks.

### Subtask status in `task-plan.md`

`task-plan.md` lists each subtask as a heading carrying its slug and a phase tag, which the per-scope
skills advance as work progresses:

```
### 1. `subtask-a` — pending
### 2. `subtask-b` — planned      (work-item: `data-layer`)   (set by /plan-implementation)
### 3. `subtask-c` — implemented  (work-item: `data-layer`)   (set by /implement)
### 4. `subtask-d` — reviewed     (work-item: `api`)          (set by /review-implementation)
### 5. `subtask-e` — committed    (work-item: `api`)          (set by /finalize)
```

Each heading is followed by a short description of that subtask. Once a subtask is folded into a
work-item (at `/plan-implementation` time), its heading also carries the `(work-item: \`slug\`)`
annotation — the two-way link between a subtask's status and the plan/review that covers it. A
work-item advances the status of **all** the subtasks it covers, together. This is the only place
subtask status lives — no separate ledger to drift.

### Configuration-driven integrations

`workflow-config.md` records _how_ the agent integrates with external systems, captured during init:

- **Task management** (Jira / Linear / GitHub Issues / none) and the access mechanism (MCP server, CLI such as `gh`, or manual).
- **Git conventions** (branch naming, commit style).
- **Changelog** practice (maintained or not, file location/format).
- **Coding standards** — references to the repo's existing rules files (e.g. `CLAUDE.md`, `.cursor/rules`); no content of its own, just pointers to what stays authoritative.

Skills read this file to decide whether to auto-fetch task data, propose branch names, prompt for changelog entries, etc. When an integration is configured but unavailable, skills degrade gracefully to manual input.

### Next-step hand-off

Every skill closes with a `> **Next step:** run \`/command\`` blockquote and explicitly stops —
chaining into the next skill is always the human's call, never automatic. Two things make that
hand-off actionable rather than just informative:

- **The command is fully resolved, not bare.** Each skill already resolves its own scope in Step 1
  (subtask slug(s), or `--task` for the whole-task path). The hand-off carries that same value
  into the next command instead of dropping it, e.g. `` `/implement data-layer` `` rather than a
  bare `` `/implement` ``.
- **Best-effort clipboard copy.** The skill copies that exact command to the OS clipboard —
  `Set-Clipboard` (Windows), `pbcopy` (macOS), or `wl-copy`/`xclip`/`xsel` (Linux) — so continuing
  the pipeline is paste-and-run. Best-effort: skip silently if none are available, never block or
  fail over it. When the copy succeeds, the hand-off line says so (`(copied to clipboard)`), so
  the user knows without checking. Copying isn't running — "stop, don't chain automatically"
  still holds.

---

## Steps / Skills

### 1. `/init-workflow` — Initialize the workflow

**Purpose:** Set up the `specs/` artifacts root and capture project-level workflow configuration.

**Produces / modifies:**

- Creates `specs/` with `workflow-config.md` and an empty `tasks/` dir.

**How it works:**

1. Create the directory structure if absent (idempotent — never clobber existing files).
2. Interview the user to fill `workflow-config.md`:
   - Which task management system (if any) and the integration mechanism.
   - For the chosen system, **verify availability** — check for the required MCP server or CLI (e.g. Jira/Linear MCP, `gh` CLI). If missing, ask the user to configure one of the supported options and record the choice.
   - Git branch/commit conventions; changelog practice.
   - Coding standards: scan the repo's rules files and record references to them (path + what each covers), rather than copying their content.

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

**Reads:** `task-info.md`, `workflow-config.md` (Coding standards), relevant codebase context.
**Produces / modifies:** `task-plan.md` in the task dir.

**How it works:**

1. **Analyze the codebase first** to understand the context of the task — this drives better questions and a better breakdown.
2. Run an **iterative Q&A loop**:
   - Ask in short rounds — cluster 2–3 tightly related questions together, keep unrelated decisions in separate rounds (later questions may depend on earlier answers).
   - Sweep a coverage checklist (scope, approach + alternatives, edge cases, non-functional needs, risks, dependencies, acceptance criteria, decomposition) before proposing; err toward one more round.
   - Keep track of the durable context the answers produce — it becomes the **Planning Notes** section of `task-plan.md`.
   - Present the breakdown for approval as a **plain message** (not an `AskUserQuestion`); repeat until the user approves.
3. Write `task-plan.md`:
   - The **overall acceptance criteria / definition of done** for the task.
   - Either an ordered **subtask list** (each heading `pending`), or an explicit **"no subtasks"** note when the task is small enough to handle in one pass.
   - **Planning Notes** capturing the durable context from the Q&A loop.
4. This is high-level only — no per-subtask implementation steps yet (those come from `/plan-implementation`).

---

### 4. `/plan-implementation` — Plan the implementation (detailed, flexible scope)

**Purpose:** Turn the high-level plan into an actionable, step-by-step plan for a chosen work-item.

**Scope:** whole task (no-subtasks path), a single subtask, or several subtasks bundled into one
work-item — resolved per **Scope resolution** above.

**Reads:** `task-plan.md` (incl. its Planning Notes), `task-info.md`, `workflow-config.md` (Coding standards), relevant codebase context.
**Produces / modifies:**

- **No-subtasks / whole-task path:** `implementation-plan.md` at the task root.
- **Subtask scope:** **one** `implementation-plan.md` in `work-items/{slug}/` covering the work-item.

**How it works:**

1. Resolve the active task and scope, and determine the work-item identity (reuse the subtask slug for a single subtask; propose a bundle slug for several).
2. Run a focused Q&A loop as needed; capture the resulting decisions inline as **Planning Notes** within the `implementation-plan.md`.
3. Get approval for the outline (affected files, contracts, steps) as a **plain message**, then write the detailed plan: target structure (rendered as an ASCII directory tree), contracts, ordered implementation steps, acceptance criteria, and verification for the work-item. Plans **prefer diagrams** over dense prose — Mermaid for flows/relationships, the ASCII tree for file layout.
4. For a **multi-subtask** work-item, run a **single coherent planning session** and write **one** plan covering all of them — not one file per subtask. The plan header lists the subtasks it covers.
5. Advance the status of each covered subtask in `task-plan.md` to `planned` and annotate each with the work-item slug.

---

### 5. `/implement` — Implement (flexible scope)

**Purpose:** Carry out the detailed plan in code.

**Scope:** same resolution as above — the work-item that was planned (whole task, one subtask, or several).

**Reads:** the work-item's `implementation-plan.md` (incl. its Planning Notes), `workflow-config.md` (Coding standards), repo rules, and the real source files the plan names.
**Produces / modifies:** source code changes; advances status in `task-plan.md`; and, only when the implementation departs materially from the plan, appends an `## Implementation Notes` section to that work-item's `implementation-plan.md`.

**How it works:**

1. Resolve the active task and work-item, and load its single `implementation-plan.md`.
2. Implement the steps in order following the plan, contracts, coding standards, and repo rules; build against the current code, not the plan's snapshot. Pause and ask only on a genuine blocker.
3. Run the plan's automated checks; fix failures you introduced and re-run until green or genuinely blocked. Record any material deviation in `## Implementation Notes`.
4. Advance the status of each covered subtask in `task-plan.md` to `implemented`.
5. Summarize what was done, hand the plan's **manual** verification to the user, and **iterate on feedback until the user explicitly accepts** before considering the step complete.

---

### 6. `/review-implementation` — Review implementation (flexible scope)

**Purpose:** Independent, report-only review of the changes against the plan and standards.

**Scope:** a work-item by default (one subtask, or several), or the whole task (`--task`) for a
cross-cutting review. When several subtasks are unreviewed, the skill asks whether to review a
specific one or all not-yet-reviewed work-items.

**Reads:** code changes (diff), the work-item's `implementation-plan.md` (incl. acceptance criteria
and any `## Implementation Notes`) and `task-plan.md` (overall DoD, incl. Planning Notes),
`workflow-config.md` (Coding standards), repo rules.
**Produces / modifies:**

- **Subtask scope:** one `review.md` per covered work-item, in `work-items/{slug}/`.
- **No-subtasks / whole-task scope:** `review.md` at the task root.

**How it works:**

1. Analyze the code changes for plan adherence, acceptance criteria / DoD, coding standards, safety & quality, pattern consistency, and scope discipline.
2. Run the plan's automated checks **read-only**, as evidence — a failure becomes a finding, it does not trigger a fix.
3. Write findings to the scoped `review.md`, each with a **severity** (Blocker / Major / Minor), the evidence that makes it valid, and a concrete suggested fix. This is **report-only** — it never edits source; `/triage-findings` acts on the findings (which carry a `Status: open` hook).
4. Advance the status of each covered subtask in `task-plan.md` to `reviewed`.

---

### 7. `/triage-findings` — Resolve the review's findings (flexible scope)

**Purpose:** Walk a `review.md`'s open findings with the user and close each one — the acting counterpart to the report-only review.

**Scope:** the work-item whose `review.md` has open findings; a `review.md` path can also be passed directly (resume triage). When several work-items have open findings, the skill asks which — and triages one report at a time.

**Reads:** the work-item's `review.md` (the findings ledger), its `implementation-plan.md` (contracts, acceptance criteria, verification), `task-plan.md` (DoD), `workflow-config.md` (Coding standards), repo rules, and the source at each finding's location.
**Produces / modifies:** source changes for approved fixes; a `Status:` on every finding in `review.md` plus a refreshed header (counts + verdict); and, only when a fix departs materially from the plan, an `## Implementation Notes` bullet on that work-item's `implementation-plan.md`.

**How it works:**

1. Resolve the scope to a `review.md`; re-read the code at each finding's location, since the review is a snapshot and the code may have moved.
2. Walk the open findings in severity order (Blocker → Major → Minor), one `AskUserQuestion` each, carrying the finding, why it's valid, and the suggested fix(es). Every finding is closed by a **user decision** — `fixed` / `skipped` / `accepted` (with justification) / `deferred` / `dismissed` / `stale` — never by the agent's own judgment that it's trivial. Decisions are written back per finding, so an interrupted session resumes cleanly.
3. Apply only approved fixes, minimal and targeted; then re-run the plan's automated checks and record any material deviation.
4. **Advances no subtask status** — the covered subtasks stay `reviewed`. The per-finding statuses are the ledger, and `/finalize`'s open-Blocker gate reads them.

---

### 8. `/finalize` — Finalize (flexible, self-detecting)

**Purpose:** Commit the current increment and, when the task is complete, wrap it up (changelog, PR).

**Reads:** `workflow-config.md`, `task-plan.md`, task artifacts, git working tree.
**Produces / modifies:** a git commit; on task completion, a changelog entry (folded into that commit) and PR/wrap-up.

**How it works:**

1. Resolve the work-item, then **gate on review**: if the scope isn't `reviewed`, or its `review.md` has open Blocker findings, **warn and let the user override** rather than hard-blocking.
2. **Determine the increment** from modified files + the work-item's `task-plan.md` status. If there are changes beyond the resolved scope, ask whether to commit only scope-related changes or everything.
3. **Detect whether this completes the task** — i.e. all other subtasks are already `committed` and none remain outstanding, or this is the whole-task / no-subtasks path:
   - **Not the last** → commit just this increment and set its subtask heading(s) to `committed`.
   - **Last / whole task** → if changelog is practiced (per `workflow-config.md`), add the entry and **include it in this same commit**, then proceed to PR / wrap-up.
4. Suggest a commit message (following configured conventions). Offer: proceed as-is, edit, or skip committing. This skill **trusts the prior review** — it does not re-run the plan's automated checks.
5. On task completion, optionally update the tracker (per config) and **prepare the PR**: always print the suggested title/body + `gh` command, and offer to push and open it when `gh` is available — never pushing or opening a PR without explicit confirmation.

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
 ┌─── per work-item (= whole task | one subtask | several subtasks) ─────────┐
 │                                                                            │
 │  /plan-implementation ─> one implementation-plan.md for the work-item       │
 │           │              (+ planning notes); status → planned               │
 │           v                                                                │
 │  /implement ──────────> code changes; status → implemented;                │
 │           │              iterate on feedback until the user accepts         │
 │           v                                                                │
 │  /review-implementation ─> one review.md per work-item; status → reviewed     │
 │           │              (report-only — never edits source)                │
 │           v                                                                │
 │  /triage-findings ────> decide each finding with the user; apply approved  │
 │           │              fixes; findings → fixed/skipped/accepted/…        │
 │           │              (status unchanged; big fixes may loop back to     │
 │           │               /review-implementation)                          │
 │           v                                                                │
 │  /finalize ───────────> commit the work-item; status → committed           │
 │                          (on the last increment: + changelog in commit + PR)│
 └────────────────────────────────────────────────────────────────────────────┘
        │  (repeat until all subtasks committed)
        v
     task done (final /finalize handled changelog + PR/wrap-up)
```

## Standalone skills

Not every skill belongs to the task pipeline. These operate independently and read no task artifacts:

- **`/review-pr` — Review someone else's pull request.** Puts the agent in the **reviewer's** seat (not the author's): it resolves a change from a `gh` PR or a local branch, diffs it against `main`/`master` (or a stated base), and writes a report to `specs/reviews/{pr-slug}.md` that **explains the change first** (a walkthrough with data-flow/sequence/component diagrams) and **lists findings second** (severity + confidence across correctness, safety, design/complexity, standards, pattern fit, and tests). It grills the solution for over-engineering and simpler alternatives, then collaborates on refining findings and phrasing comments. It never edits source and never advances task status — there are no plans, specs, or DoD involved, and it works on any repo even without a `specs/` directory.
- **`/qa-scenarios` — Generate test scenarios for QA from your changes.** Produces a **manual-QA handoff document** from a diff (a `gh` PR or a local branch against `main`/`master`, plus uncommitted working-tree changes). Writes `specs/qa/{pr-slug}.md` with a **flexible, jargon-free description** of what the change does from a tester's perspective (prose, lists, subsections, or a diagram as the logic warrants) followed by **concise step-by-step test scenarios** (Preconditions/Steps/Expected) covering edge cases, variants, configurations, and the directly affected flows that could regress. Shared preconditions, test data, and step flows are factored into reusable named blocks to avoid duplication. Standalone — needs no plan or implementation artifacts, is black-box throughout, and never edits source.
- **`/workflow-status` — Re-entry snapshot: where a task stands, what's next.** The pickup point after stepping away from a task. Resolves the active task (explicit arg, else current-branch inference), reads `task-plan.md` and each referenced work-item's `implementation-plan.md` / `review.md`, and cross-checks that against light git state (branch match, working-tree cleanliness, a log skim). Reports each subtask's phase, flags any drift between recorded status and what's actually on disk, and closes with **one** recommended next command — the earliest-phase outstanding subtask, following the same resolution order the pipeline skills already use. Read-only throughout: it never edits `task-plan.md`, source, or git state, even when it finds drift.

## Status / future

- All eleven skills are implemented under `artifacts/dev-workflow/skills/`: the eight-step pipeline (`init-workflow`, `start-task`, `plan-task`, `plan-implementation`, `implement`, `review-implementation`, `triage-findings`, `finalize`) plus the standalone `review-pr`, `qa-scenarios`, `workflow-status`. This document is the high-level design; each `SKILL.md` is the authoritative spec for its step.
- Wiring `dev-workflow` into the CLI as an installable registry scope (so `npx @patryk.mroz/artifacts install dev-workflow` distributes it) is **deferred**.
