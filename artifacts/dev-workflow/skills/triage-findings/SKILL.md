---
name: triage-findings
description: Use after /review-implementation, when a work-item's review.md has open findings to resolve. Walks the findings interactively — severity order, one decision per finding — applying only the fixes the user approves, re-running the plan's automated checks, and recording every decision back into review.md. Subtask status stays "reviewed"; the finding statuses are the ledger. Run before /finalize.
---

# /triage-findings — Resolve a review's findings, one decision at a time

Walk the open findings in a work-item's `review.md` with the user and close each one: fix it, fix it differently, skip it, accept the risk, defer it, or dismiss it. Every decision is the **user's** — this skill applies what they approve and records what they decided.

Where `/review-implementation` is report-only, this skill is the counterpart that acts on the report. It does **not** re-review the code: it works the findings in front of it and nothing else.

**Reads:** the work-item's `review.md` (the findings ledger), its `implementation-plan.md` (**Contracts**, **Acceptance Criteria**, **Verification** — a fix must not break a contract), `specs/tasks/{task}/task-plan.md` (Definition of Done), `specs/workflow-config.md` (Coding standards), repo rules, and the source files each finding names.
**Produces:** source changes for approved fixes; an updated `Status:` on every finding in `review.md` plus a refreshed header; and, only when a fix departs materially from the plan, an `## Implementation Notes` bullet on that work-item's `implementation-plan.md`.

## The work-item model

A **work-item** is the unit `/plan-implementation` planned, `/implement` built, and `/review-implementation` reported on: one subtask, several subtasks, or the whole task, with exactly one `implementation-plan.md` and one `review.md`. Triage operates on the same unit.

```
specs/tasks/{task}/
├── task-plan.md # subtask list + status (SoT) + DoD
├── implementation-plan.md # no-subtasks / whole-task path (flat, at root)
├── review.md # no-subtasks / whole-task findings (flat, at root)
└── work-items/
    └── {work-item-slug}/
        ├── implementation-plan.md
        └── review.md # the findings this skill resolves
```

**Triage contract:** resolve the scope to a `review.md`, put every open finding to the user, apply only what they approve, re-run the plan's automated checks, and write each decision back as it's made. **Subtask status is not advanced** — it stays `reviewed`. The per-finding `Status:` fields are the ledger, and `/finalize`'s open-Blocker gate reads them.

## Finding statuses

`/review-implementation` writes every finding as `Status: open`. This skill closes each one:

| Status        | Meaning                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| **fixed**     | A fix was applied. Records which option, or what was done instead.              |
| **skipped**   | Not worth acting on now. No justification required.                            |
| **accepted**  | Real, but the risk is knowingly taken. Carries the user's justification — this is what un-gates a Blocker at `/finalize`. |
| **deferred**  | Real, but out of this increment. Optionally becomes a subtask in `task-plan.md`. |
| **dismissed** | The user disagrees that it's valid. Carries their reason.                      |
| **stale**     | The code moved since the review; the finding no longer applies.                |

## Process

### Step 1: Resolve task and scope

1. **Resolve the task:** explicit task argument > inference from the current git branch > ask the user. Confirm `specs/tasks/{task}/task-plan.md` exists — if not, stop and point to `/plan-task`.
2. **Resolve the scope → `review.md`**, in order:
   - **A path to a `review.md`** passed as the argument → resume triage on that file. Wins.
   - **Explicit subtask name(s)** → map each to its work-item via the `(work-item: \`slug\`)` annotation in `task-plan.md`; or `--task` for the whole-task review at the task root.
   - **No argument** → find work-items whose `review.md` has findings still `Status: open`:
     - **None** → nothing to triage. If nothing is `reviewed` yet, point to `/review-implementation`; if every finding is already closed, say so and point to `/finalize`. Stop.
     - **Exactly one** → triage it.
     - **More than one** → ask with `AskUserQuestion`: a **specific work-item**, or **all with open findings**.
   - **No-subtasks path** → the `review.md` at the task root.
3. For a multi-work-item selection, triage them **one `review.md` at a time**, finishing each before starting the next — a decision is only meaningful next to its own plan.

### Step 2: Read context

For each `review.md` in scope:

1. Parse the findings — ID, severity, dimension, location, the finding, why it's valid, the suggested fix(es), and current `Status:`. Filter to `open`; findings already closed stay closed.
2. Read the work-item's `implementation-plan.md` — **Contracts**, **Acceptance Criteria**, and **Verification**. A fix that breaks a contract is a deviation, not a fix.
3. Read `task-plan.md`'s **Definition of Done**, `specs/workflow-config.md`'s Coding standards, and repo rules (`CLAUDE.md` / `AGENTS.md` / `.cursor/rules`).
4. **Re-read the actual code at each finding's `file:line`.** The review is a snapshot and the code may have moved. If a finding no longer applies, don't drop it silently — surface it to the user in the loop (Step 3) and let them confirm `stale`.

### Step 3: The triage loop

Walk the open findings in severity order — **Blocker → Major → Minor**. For each, one `AskUserQuestion` carrying enough context to decide without scrolling back: the finding's ID and title, severity, dimension, location, the finding itself, **why it's valid**, and the suggested fix(es).

Use `Finding [n] of [total open]` as the question header. Options:

**When the review offered two fix options** (a genuine tradeoff — one is marked `⭐ Recommended`):

- **Apply Fix A ⭐** — [Fix A one-liner]
- **Apply Fix B** — [Fix B one-liner]
- **Fix differently** — Different approach — let's discuss.
- **Skip** — Not worth fixing now.

**When the review offered one fix:**

- **Fix now** — [the fix, one line]
- **Fix differently** — Different approach — let's discuss.
- **Skip** — Not worth fixing now.
- **Accept risk** — Valid, but I'm taking it knowingly.

The user can always answer in free text; `Defer`, `Dismiss`, and `Accept risk` are reachable that way even when they aren't among the four options. Interpret intent rather than re-asking.

**Handling each response:**

- **Apply Fix A/B / Fix now** → show the exact before/after, confirm briefly, apply. `Status: fixed` (naming the option: "fixed via Fix A").
- **Fix differently** → ask what they'd prefer, apply it, `Status: fixed` with a one-line note on what was done instead of the suggestion.
- **Skip** → `Status: skipped`. Move on — don't argue, don't re-pitch the fix.
- **Accept risk** → ask for the justification if they didn't give one, record it. `Status: accepted`.
- **Defer** → `Status: deferred`. Offer (via `AskUserQuestion`) to add a `pending` subtask to `task-plan.md` capturing the follow-up; if they decline, the finding's status is the record.
- **Dismiss / disagree** → record their reason. `Status: dismissed`.
- **Stale** (you flagged it in Step 2 and they confirm) → `Status: stale` with a one-line note on what changed.

**Write each decision to `review.md` as it's made** — before moving to the next finding. An interrupted session then resumes cleanly by re-filtering to `open`.

Keep the fixes **minimal and targeted**: change what the finding names. Don't refactor the surrounding code, don't fix things nobody flagged, and don't bundle unrelated cleanups into a triage edit.

Keep momentum — the user has already read the report. Don't re-explain a finding they just decided on.

### Step 4: Verify

If anything was fixed:

1. Run the plan's **Automated** verification — the exact tests, lint, typecheck, and build commands it names (use Bash).
2. **Fix what the fixes broke** and re-run, looping until green or you hit a genuine blocker (an environment problem, a pre-existing failure unrelated to this work, or a contradiction that needs the user).
3. **Never silently skip a red check.** If something is still failing at the end, report it with the actual output and say why.

If nothing was fixed — every finding skipped, accepted, deferred, or dismissed — skip this step entirely rather than re-running green checks for nothing.

### Step 5: Record material deviations (only if any)

If a fix departed **materially** from the plan — a contract had to change, an approach was swapped, a file moved — append one bullet to **this work-item's** `implementation-plan.md`:

```markdown
## Implementation Notes

- [What changed vs. the plan, and why. One bullet per material deviation — concise, not a diary.]
```

Add to the existing section if `/implement` already created one. **Skip the section entirely** when the fixes stayed inside the plan — a routine fix at a flagged line is not a deviation.

### Step 6: Update the review header

Recompute the `review.md` header from the decisions:

- **Findings:** counts by status — e.g. `5 findings · 3 fixed · 1 accepted · 1 skipped`.
- **Verdict:** **Rejected** while any Blocker is still `open` · **Needs attention** while any Major is still `open` · **Approved** otherwise. `fixed`, `accepted`, `dismissed`, `stale`, and `skipped` all count as closed; only `open` and `deferred` gate.
- Leave the dimension verdicts as the reviewer wrote them — they're the record of what the review found, not of what triage did.

Don't touch `task-plan.md` status. The covered subtasks stay `reviewed`; `/finalize` carries them to `committed`.

### Step 7: Summarize and hand off

Print a tight status block:

```text
<review.md path>           findings: 5 · fixed 3 · accepted 1 · skipped 1
<files changed>            [modified]
Checks: <cmd> ✓  <cmd> ✓   Deviations: <n recorded, or none>
Verdict: <Approved | Needs attention | Rejected>
```

Resolve the exact next command using this work-item's covered subtask slug(s) (or `--task` on the
no-subtasks path) for whichever branch below applies, and copy it to the clipboard
(best-effort: `Set-Clipboard`/`pbcopy`/`xclip`).

Then close with the next step, as a **plain message** (not an `AskUserQuestion`), and stop — don't chain automatically:

- **If the fixes were architectural or wide-blast-radius** (a contract changed, a module boundary moved, several files restructured): > **Next step:** re-run `/review-implementation data-layer` — these fixes are big enough to deserve a fresh look.
- **If any Blocker is still `open`:** > **Next step:** the review is still Rejected on `<F-ids>`. Re-run `/triage-findings data-layer` to resolve them, or accept the risk explicitly before `/finalize`.
- **Otherwise:** > **Next step:** run `/finalize data-layer` to commit this increment.

## Notes

- **The user decides, always.** Never close a finding on your own judgment that it's trivial, out of scope, or too big. Put it to them and apply the answer. The one exception is a finding the code has outrun — and even that is surfaced for confirmation, not dropped.
- **Act on the report, don't redo it.** This skill resolves the findings in front of it. New problems you happen to notice aren't findings — mention them in the hand-off and let `/review-implementation` catch them on a re-run.
- **Minimal, targeted edits.** Fix what the finding names. No opportunistic refactoring, no improving code nobody flagged.
- **Contracts still bind.** A fix that breaks the plan's contracts is a deviation to record (Step 5), not a free improvement.
- **Write decisions as you go.** `review.md` is updated per finding, not in a batch at the end — that's what makes an interrupted session resumable.
- **Status lives in two places, deliberately.** Subtask phase stays in `task-plan.md` (`reviewed`, untouched here); per-finding resolution lives in `review.md`. `/finalize` reads both.
- **Skipping is a legitimate outcome.** A review that ends with four skips and one fix is a successful triage, not a failure.
- **No auto-chain.** Summarize, point to the next step, and stop. Copying the resolved command to the clipboard is a convenience, not an invocation — never run the next skill yourself.
