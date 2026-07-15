---
name: review-implementation
description: Use after /implement, when a work-item's changes need an independent review against its implementation-plan.md, acceptance criteria, and coding standards. Resolves the scope from task-plan.md (asks when several subtasks are unreviewed), analyzes the diff for plan adherence, safety, quality, and pattern compliance, then writes a review.md of findings (severity + why-it's-valid + suggested fixes) and advances the covered subtasks to "reviewed". Report-only — it never edits source; a later /implement pass acts on the findings. Run before /finalize.
---

# /review-implementation — Independent review of a work-item

Review a resolved **work-item**'s changes against the plan that produced them — its `implementation-plan.md`, the acceptance criteria, the task's Definition of Done, and the project's coding standards. The output is a `review.md` of findings, each with a severity, the evidence that makes it valid, and a concrete suggested fix.

This skill is **report-only**: it analyzes and writes the report, it does **not** edit source code. The user decides what to act on, and a later `/implement` pass addresses the findings. Keeping review separate from fixing is what makes the review independent.

**Reads:** the work-item's `implementation-plan.md` (Target Structure, Contracts, Acceptance Criteria, Verification, and any `## Implementation Notes`), `specs/tasks/{task}/task-plan.md` (Definition of Done), `specs/coding-standards.md`, repo rules, and the actual code changes (diff).
**Produces:** one `review.md` per covered work-item (beside its plan), and status updates in `task-plan.md`.

## The work-item model

A **work-item** is the unit `/plan-implementation` planned and `/implement` built: one subtask, several subtasks, or the whole task, with exactly one `implementation-plan.md`. Review operates on the same unit and writes one `review.md` next to that plan. Status stays per-subtask in `task-plan.md`.

```
specs/tasks/{task}/
├── task-plan.md # subtask list + status (SoT) + DoD
├── implementation-plan.md # no-subtasks / whole-task path (flat, at root)
├── review.md # no-subtasks / whole-task review (flat, at root)
└── work-items/
    └── {work-item-slug}/
        ├── implementation-plan.md
        └── review.md # the report this skill writes
```

**Review contract:** resolve the scope, read the plan and changes, analyze across the review dimensions, write `review.md`, then advance the covered subtasks to `reviewed`. Don't edit source. Don't advance status until the report is written.

## Severity

| Severity     | Meaning                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------- |
| **Blocker**  | Must fix. Broken acceptance criteria / DoD, security hole, data-safety risk, failing required checks. |
| **Major**    | Should fix. Reliability, quality, pattern, or coding-standards violation that will bite later. |
| **Minor**    | Optional. Nits, style, small suggestions — record them, but they don't gate the work.     |

**Verdict thresholds:** Rejected on any **Blocker** · Needs attention on one or more **Majors** · Approved otherwise.

## Process

### Step 1: Resolve task and scope

1. **Resolve the task:** explicit task argument > inference from the current git branch > ask the user. Confirm `specs/tasks/{task}/task-plan.md` exists — if not, stop and point to `/plan-task`.
2. **Resolve the scope → work-item(s):**
   - **Explicit argument** wins: subtask name(s) → map each to its work-item (via the work-item annotation in `task-plan.md`); or `--task` for a cross-cutting whole-task review.
   - **No argument** → read `task-plan.md` and find subtasks that are `implemented` but not yet `reviewed`:
     - **None** → nothing to review. If subtasks are only `planned`/`pending`, point to `/implement`; if everything is already `reviewed`, say so. Stop.
     - **Exactly one** unreviewed work-item → review it.
     - **More than one** → ask with `AskUserQuestion`: review **a specific subtask/work-item** or **all not-yet-reviewed**.
   - **No-subtasks path** → review the whole task (`review.md` at the task root).
3. For an "all not-reviewed" or multi-subtask selection, gather the set of covered work-items. Each gets its **own** `review.md`, written from a single analysis pass (Step 6).
4. **Check for an existing `review.md`** at a resolved location. If one exists, this is a re-review: note its prior verdict and open findings, and write a fresh report rather than silently appending.

### Step 2: Read context

For each covered work-item:

1. Read its `implementation-plan.md` in full — **Target Structure**, **Contracts**, **Acceptance Criteria**, **Verification**, and any **`## Implementation Notes`** (the deviations `/implement` recorded; these are prime review targets).
2. Read `task-plan.md`'s **Definition of Done** for the covered subtasks, `specs/coding-standards.md`, and repo rules (`CLAUDE.md` / `AGENTS.md` / `.cursor/rules`).
3. Treat the plan as the ground truth for *intent* and the standards as the ground truth for *quality*. The review measures the code against both.

### Step 3: Establish the diff

Determine what actually changed for the scope:

1. Anchor on the plan's **Target Structure** file list, plus `git status` and `git diff` for the working tree. For a `--task` cross-cutting review, also diff against the base branch to capture already-committed increments.
2. Classify each file:
   - **In plan AND changed** → expected; verify the content matches intent.
   - **Changed but NOT in plan** → possible scope creep; investigate and flag.
   - **In plan but NOT changed** → possible missing implementation; flag.
3. Read the changed files. Be specific about locations — every finding needs a `file:line`.

### Step 4: Analyze across dimensions

Scan the changes against each dimension and collect findings:

- **Plan Adherence** — does the implementation realize the plan's steps and contracts? Intent mismatches, skipped items, undocumented deviations (cross-check `## Implementation Notes`).
- **Acceptance Criteria / DoD** — does the work satisfy the scope's acceptance criteria and the slice of the task DoD it owns?
- **Coding Standards & Repo Rules** — violations of `coding-standards.md` and the repo's rules files.
- **Safety & Quality** — security (injection, secrets, missing authz at boundaries), performance (N+1, unbounded loops, missing pagination), reliability (unhandled errors at external boundaries, races, resource leaks), data safety (destructive ops, unsafe migrations).
- **Pattern Consistency** — compare against 1–2 similar existing files; flag substantive mismatches (naming, layering, error handling), not trivial style.
- **Scope Discipline** — changes that reach beyond this work-item's scope.

Be precise and evidence-based: "`src/auth/handler.ts:42` — query built by string concatenation, vulnerable to injection" — not "there might be a security issue". Don't flag style preferences that don't matter; if the code works and follows the plan, minor formatting is a Minor observation at most.

### Step 5: Run the plan's automated checks (read-only)

Run the plan's **Automated** verification commands (tests, lint, typecheck, build) with Bash, purely as evidence. Record each command and its pass/fail with the relevant output. **Do not fix anything** — a failing check becomes a finding, it doesn't trigger an edit. Note the plan's **Manual** verification items as outstanding context for the report; don't mark them done.

### Step 6: Write review.md

For each covered work-item, write `review.md` to:

- **Subtask scope:** `specs/tasks/{task}/work-items/{work-item-slug}/review.md`
- **No-subtasks / whole-task:** `specs/tasks/{task}/review.md` (flat, at root)

```markdown
# Review: [work-item / scope title]

**Scope:** work-item `{slug}` covering subtasks `a`, `b`   (or: whole task — cross-cutting)
**Plan:** specs/tasks/{task}/work-items/{slug}/implementation-plan.md
**Date:** YYYY-MM-DD
**Verdict:** Approved | Needs attention | Rejected
**Findings:** N blockers · N majors · N minors

## Dimension Verdicts

| Dimension            | Verdict            |
| -------------------- | ------------------ |
| Plan Adherence       | PASS/WARNING/FAIL  |
| Acceptance Criteria  | PASS/WARNING/FAIL  |
| Coding Standards     | PASS/WARNING/FAIL  |
| Safety & Quality     | PASS/WARNING/FAIL  |
| Pattern Consistency  | PASS/WARNING/FAIL  |
| Scope Discipline     | PASS/WARNING/FAIL  |

## Verification

**Automated:** [each command run → pass/fail, with output for failures]
**Manual:** [items from the plan still needing a human check]

## Findings

[Sorted Blocker → Major → Minor. Omit a severity group when it has no findings.
If there are no findings at all, state that explicitly and give the Approved verdict.]

### F1 — [short title]

- **Severity:** Blocker | Major | Minor
- **Dimension:** Safety & Quality
- **Location:** `path/to/file.ts:42`
- **Finding:** What's wrong, with evidence — plan said X, code does Y; or the standard/rule violated.
- **Why it's valid:** The concrete risk or cost if left as-is — why this is worth a reviewer's attention, not a preference.
- **Suggested fix:** One concrete fix. Only when there's a genuine tradeoff, offer two options as
  `[approach] · Strength: [advantage] · Tradeoff: [cost]` and mark exactly one `⭐ Recommended`.
- **Status:** open
```

Keep findings concrete and capped at what's worth acting on — consolidate related nits rather than padding the list. The `Status: open` field is the hook a later `/implement` pass flips when it addresses a finding.

### Step 7: Update task-plan.md

Advance each covered subtask `implemented → reviewed` in `task-plan.md`, preserving its work-item annotation:

```
### 2. `migrate-user-table` — reviewed (work-item: `data-layer`)
### 3. `backfill-script` — reviewed (work-item: `data-layer`)
```

For the no-subtasks / whole-task path there is no per-subtask status to advance — the `review.md` at the task root is the record. Touch only the status on the covered headings; leave everything else in `task-plan.md` untouched.

### Step 8: Self-review the report

Read each written `review.md` with fresh eyes and fix issues inline before handing off:

1. Every finding has a real `file:line`, evidence in **Finding**, and a non-obvious justification in **Why it's valid** — no vague nits.
2. Every **Suggested fix** is concrete and actionable; two options appear only where there's a real tradeoff.
3. The **Verdict** matches the thresholds (any Blocker → Rejected; any Major → Needs attention; else Approved).
4. The dimension verdicts are consistent with the findings listed.
5. The report stayed within the work-item's scope and didn't drift into unrelated code.

### Step 9: Summarize and hand off

Print a tight status block:

```text
<review.md path(s)>        [created]
task-plan.md               subtasks → reviewed: a, b
Verdict: <Approved | Needs attention | Rejected>
Findings: <N blockers · N majors · N minors>
```

Then close with the next step, as a **plain message** (not an `AskUserQuestion`), and stop — don't chain automatically:

- **If there are Blocker or Major findings:** > **Next step:** run `/implement` to address the findings in `review.md`, then re-run `/review-implementation`.
- **Otherwise:** > **Next step:** run `/finalize` to commit this increment.

## Notes

- **Report-only.** This skill analyzes and writes `review.md`; it never edits source. Findings are acted on by a later `/implement` pass — that separation is what keeps the review independent.
- **Evidence over opinion.** Every finding names a location and the concrete risk or violated standard. "Might be a problem somewhere" is not a finding.
- **Don't flag style for its own sake.** If the code works and follows the plan, minor formatting differences are Minor observations, not Majors.
- **The plan can be wrong too.** If the implementation faithfully followed a flawed plan (e.g. an insecure approach), flag the underlying issue — review catches plan defects, not just code defects.
- **Cross-check Implementation Notes.** The deviations `/implement` recorded are the highest-yield place to look for drift and undocumented scope.
- **One review.md per work-item.** A multi-subtask or "all not-reviewed" selection produces one report per work-item from a single analysis pass — not a merged report.
- **Status lives in task-plan.md.** This skill advances covered subtasks `implemented → reviewed`; `/finalize` carries them to `committed`. There is no separate ledger.
- **No auto-chain.** Summarize, point to the next step, and stop.
