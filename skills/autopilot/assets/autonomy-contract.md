# Autonomy contract

The rules every `auto-*` stage skill follows during an unattended `/autopilot` run.
Read this alongside the stage's own `SKILL.md` and the core skill it derives from.

Follow [workflow integrity](../../plan-task/references/workflow-integrity.md) for
all phases, verification/finding/QA gates, stable history, and commit recovery.
The autonomous overrides never waive required checks or permit clearing a
Blocker by skipping, deferring, accepting, or dismissing it.

## You have no user

`AskUserQuestion` is unavailable to you — a delegated agent has no channel back
to a person, and a harness will generally strip interactive prompting from one
outright. There is nobody to answer a question, no prompt will ever be seen, and
waiting for one hangs the whole run.

So every point where your core skill **asks**, **proposes for approval**, or
**iterates until the user accepts** is not a thing to work around — it is a
decision you make yourself, record, and move past. Your stage's Overrides table
names each one.

Three rules follow from that:

- **Never wait.** No "let me know", no "confirm before I proceed", no question
  addressed to a reader. Decide, log, continue.
- **Never invent authority you don't have.** You decide *technical* questions.
  You do not knowingly take a risk on the user's behalf, transition their
  tracker tickets, or take outward-facing actions the config hasn't
  pre-authorized.
- **Leave a trail.** A human reads the result afterward instead of watching it
  happen. `decisions.md` is how they reconstruct what you chose and why.

## Decision logging

Every call you make that the core skill would have put to the user gets one
entry appended to `specs/tasks/{task}/decisions.md` — create the file on first
write with an `# Autonomous Decisions: {task title}` heading, then append.
Number entries `D1`, `D2`, … continuing from whatever is already in the file, so
IDs stay unique across stages and across resumed runs.

```markdown
### D4 — Token refresh handled in middleware, not the route handler

- **Stage:** auto-plan-implementation   **Scope:** work-item `data-layer`
- **Decision:** Refresh-on-expiry lives in `src/auth/middleware.ts`, so every
  guarded route inherits it.
- **Alternatives considered:** Per-route refresh (rejected — four call sites
  would each repeat the same branch); a background refresh timer (rejected —
  no process-level scheduler exists in this codebase).
- **Rationale:** `src/auth/middleware.ts:20-38` already centralizes the access
  check every guarded route runs through; the plan's Contracts put the token
  pair on the same request context.
- **Confidence:** High
```

What earns an entry: a choice between real alternatives, an assumption filling a
gap in the artifacts, a deviation from what an artifact said, an interpretation
of a vague goal. What does not: routine mechanics the plan or the codebase
already settles. A log where everything is an entry is as unreadable as an empty
one — aim for the calls a reviewer would actually want to audit.

**Process mechanics never earn an entry, no matter how a stage's Overrides
table phrases the replacement.** Branch selection, subtask decomposition, the
automated/manual split in Verification, and tracker-ticket transitions are
each already recorded in their own artifact — the Branch line, the subtask
list, the plan's Verification section, the PR/ticket action itself — and are
driven by `workflow-config.md` or git/tracker state, not by weighing real
alternatives. Each stage's own section says explicitly where this applies;
when a new case isn't named, judge it the same way: does it pick between
substantively different ways the *code* could work, or is it bookkeeping for
how the *pipeline* ran?

**Rationale must cite evidence** — a `file:line`, a named pattern, or the
artifact text that drove it. "It seemed cleaner" is not a rationale.

**Alternatives must be real.** If there was genuinely only one sane option, say
so in one clause rather than manufacturing a rejected straw man.

## Confidence

Rate every entry. The rubric is fixed so the levels mean the same thing in every
stage:

| Level | When |
| --- | --- |
| **High** | The artifacts or the codebase answer it directly — one option is clearly right given `task-info.md`, `task-plan.md`, the plan's Contracts, or an established repo pattern. |
| **Medium** | Several defensible options; one is favored by a repo convention or a stated constraint, but a reasonable human might pick another. |
| **Low** | Genuinely ambiguous, contradicts an artifact, or shapes architecture beyond the current scope. |

Rate honestly. A `Low` costs the run one extra check; a `Low` mislabeled `High`
costs it a silent wrong turn nobody catches. When you're between two levels,
take the lower one.

Every `Low` entry triggers a sanity check by a second agent after your stage
returns — that check is the coordinator's job, not yours. Log the decision, keep
going, and don't try to arrange the review yourself.

## Stage report

End your run by returning this block to whoever dispatched you. It replaces the
core skill's hand-off entirely — **no clipboard copy, no `> **Next step:**`
line, and never invoke the next skill yourself.** The coordinator is the sole
router; a stage that chains into another stage breaks the run.

```
STATUS: complete | blocked
STAGE: auto-implement
SCOPE: work-item `data-layer` (subtasks add-token-store, wire-middleware)
ARTIFACTS: specs/tasks/add-oauth/work-items/data-layer/implementation-plan.md
STATUS-ADVANCED: add-token-store, wire-middleware → implemented
DECISIONS: D4 (High), D5 (Low)
OUTSTANDING: manual check — confirm the login redirect lands on /dashboard
```

- **`STATUS: blocked`** includes required acceptance verification that cannot be
  completed, exhausted required QA retests, unsafe separation of mixed changes,
  or unreconciled finalization state. It is also for work genuinely impossible to continue —
  a missing credential, an unreachable dependency, a precondition the pipeline
  order should have satisfied and didn't. It is *not* for a hard decision. A
  hard decision is a `Low`-confidence entry, and you keep going.
- **`ARTIFACTS`** lists every file you wrote or modified, repo-relative.
- **`STATUS-ADVANCED`** names the subtasks you moved and their new phase, or
  `none` (the no-subtasks path advances nothing).
- **`OUTSTANDING`** carries anything a human still needs to do or know —
  unverifiable manual checks, incomplete QA coverage, findings you deferred,
  the blocker reason. `none`
  when there's nothing.

Write the artifacts before you report. The files on disk are what the
coordinator trusts; the report only describes them.

## Amend runs

Sometimes you'll be dispatched to **amend** work your stage already did — the
prompt says so explicitly and names what to change, because a sanity check on one
of your `Low`-confidence decisions came back `revise`.

An amend is not a re-run and not a restart. Do the narrow thing the prompt names:
correct the artifact or the code, leave everything else alone, and **update that
decision entry in place** rather than appending a new one — amend its
`Decision` / `Rationale` and add a closing line noting it was revised on review
and why. Then report as usual.

This is the one case where a stage's "don't redo already-advanced work" guard
doesn't apply: the coordinator asked for the change, and it will re-verify the
result. There is exactly one amend per stage, so make it count.

## Inherited behavior stays inherited

Your Overrides table is a **replacement list, not a licence**. Everything the
core skill says that the table doesn't name still binds you — the artifact
templates, the self-review steps, scope discipline, "build against current code,
not the plan's snapshot", the granularity and merge rules, the requirement that
automated checks actually pass.

Those rules are load-bearing precisely because nobody is watching. The user's
review, which normally catches an over-fragmented plan or a half-done
verification, is the thing autonomy removes — so the written-down discipline is
all that's left.
