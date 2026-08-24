---
name: autopilot
description: Run the whole dev-workflow pipeline unattended — start-task through finalize, every subtask, in one go. Use when the user wants a task driven end to end without being asked anything: "run this on autopilot", "do the whole task yourself", "run the pipeline for X", "take this ticket start to finish". Coordinates the auto-* stage skills by dispatching one subagent per stage, routes purely from task-plan.md's status ledger, sanity-checks low-confidence decisions with a second agent, and finishes with a PR/MR or a report per workflow-config.md's Autopilot section. Starts immediately, with no confirmation gate, and never pauses.
---

# /autopilot — Run the pipeline unattended

Drive a task through the entire dev-workflow — `start-task` → `plan-task` →
`plan-implementation` → `implement` → `review-implementation` →
`triage-findings` → `finalize`, across every subtask — in one run, without
asking the user anything once it starts.

You are the **coordinator**. You do not plan, implement, review, or commit
anything yourself: you read the state on disk, decide which stage runs next,
dispatch a subagent to run it, verify what changed, and loop. Each stage runs the
autonomous `auto-*` counterpart of the normal skill.

**Reads:** `specs/workflow-config.md` (incl. its `## Autopilot` section),
`specs/tasks/{task}/task-plan.md` and the work-item artifacts under it.
**Produces:** no artifacts of its own — the stages write those. It prints a run
ledger and a final report, and on completion may open a PR/MR through
`auto-finalize` when the config pre-authorizes it.

**Scope warning worth stating plainly:** this pipeline never stops to ask, so
nobody catches a wrong turn mid-run. It's built for straightforward tasks. A
task with contested architecture, a risky migration, or high blast radius wants
the normal human-in-the-loop skills, not this one.

## Why subagents, not you

A whole task's worth of codebase reading, diffs, review reports, and triage
transcripts will not fit in one context. Dispatching each stage keeps that work
out of yours: a stage returns a short report, you keep the routing state. It also
keeps `auto-review-implementation` genuinely independent — a fresh agent reviews
the code, rather than the same context that just wrote it marking its own
homework.

## Process

### Step 1: Resolve the entry point

1. Confirm `specs/workflow-config.md` exists. If `specs/` is missing entirely,
   stop and point the user at `/init-workflow` — there's no config to read and
   no `tasks/` root to write into.
2. Read `specs/workflow-config.md` in full, including its **`## Autopilot`**
   section. That section's **Completion mode** governs Step 7; if the section is
   absent, the mode is **report only** (see *Completion mode* below).
3. Resolve what this run is about, from the invoking arguments:
   - **A task name** that matches an existing `specs/tasks/{task}/` → resume
     that task wherever it left off.
   - **A description or a ticket reference** with no existing workspace → a
     fresh run, starting at `auto-start-task`. Carry the user's wording through
     verbatim; it is the task's primary source and outranks anything a tracker
     later returns.
   - **Nothing** → infer the task from the current git branch. If that fails,
     ask the user which task to run (this is before the run starts — questions
     here are fine).
4. If the workspace exists, read `task-plan.md` and take stock: which subtasks
   are at which phase, which work-items exist, whether any `review.md` has open
   findings.
5. Print one line before dispatching anything — the resolved task, whether it's
   a fresh start or a resume, and the **completion mode** from the config,
   spelled out concretely (*"ends by pushing the branch and opening a PR"* or
   *"commits locally; nothing is pushed"*). This is a status line, not a
   question: do not use `AskUserQuestion` and do not wait for a reply. Then
   start dispatching immediately. From here on, do not ask the user anything,
   even if a stage returns blocked — report at the end instead.

### Step 2: Route from disk state

Decide the next stage by reading `task-plan.md` (and the relevant `review.md`),
never from a stage's say-so. Take the **earliest-phase outstanding subtask** —
the same resolution order every pipeline skill uses:

| State on disk | Dispatch |
| --- | --- |
| No `specs/tasks/{task}/` yet | `auto-start-task` |
| Workspace exists, no `task-plan.md` | `auto-plan-task` |
| Earliest outstanding subtask is `pending` | `auto-plan-implementation` |
| …is `planned` | `auto-implement` |
| …is `implemented` | `auto-review-implementation` |
| …is `reviewed`, its `review.md` has `Status: open` findings | `auto-triage-findings` |
| …is `reviewed`, no open findings | `auto-finalize` |
| Every subtask `committed` (or the no-subtasks path is committed) | Done — go to Step 7 |

On the **no-subtasks path** there are no per-subtask statuses to read. Route on
which artifacts exist at the task root instead: no `implementation-plan.md` →
`auto-plan-implementation`; plan but no code changes or no `review.md` →
`auto-implement` then `auto-review-implementation`; `review.md` with open
findings → `auto-triage-findings`; otherwise → `auto-finalize`.

**You are the sole router.** Stages never hand off to each other and never
decide what runs next. Every transition comes back through this step.

### Step 3: Dispatch the stage

One `general-purpose` subagent per stage. It has seen **none** of this
conversation, so the prompt must stand alone. Include:

- The repo root (absolute) and the task name.
- The **resolved scope** — the subtask slug(s) or work-item, or an explicit note
  that this is the whole-task / no-subtasks path. Always pass scope explicitly;
  it pre-empts the scope-disambiguation logic in the stage skills.
- Absolute paths to `specs/workflow-config.md`, `specs/tasks/{task}/task-plan.md`,
  the work-item folder, and `decisions.md`.
- The instruction to run the named `auto-*` skill: invoke it as a skill, and if
  it isn't listed in that session, read its `SKILL.md` directly and follow it —
  along with the core skill and the autonomy contract it points at. Give the
  **absolute** path, resolved from wherever this project's skills are actually
  installed (`.claude/skills/` or `.cursor/skills/`, whichever exists in the
  repo).
- An explicit **"you cannot ask questions"**: `AskUserQuestion` is unavailable,
  nobody will read a question, decide and log instead.
- The stage report block to return (from the autonomy contract).

Example:

```
Run the /auto-implement stage of a dev-workflow autopilot run. Repo root:
C:/dev/acme-api. Task: add-oauth-login. Scope: work-item `data-layer`,
covering subtasks `add-token-store` and `wire-middleware`.

Invoke the `auto-implement` skill. If it is not available, read and follow
C:/dev/acme-api/<skills-dir>/auto-implement/SKILL.md — it tells you which core
skill and autonomy contract to read alongside it.

Artifacts:
  specs/workflow-config.md
  specs/tasks/add-oauth-login/task-plan.md
  specs/tasks/add-oauth-login/work-items/data-layer/implementation-plan.md
  specs/tasks/add-oauth-login/decisions.md   (append your decisions here)

You have no user. AskUserQuestion is unavailable and nobody will see a
question — decide, log the decision with a confidence rating, and continue.
Do not print a next-step line, do not copy anything to the clipboard, and do
not invoke any other skill.

Return the stage report block exactly as the autonomy contract specifies.
```

Dispatch **one stage at a time** and wait for it. Stages are strictly ordered —
there is nothing to parallelize, and two agents writing `task-plan.md` at once
would corrupt the ledger.

### Step 4: Verify against disk

When the stage returns, **re-read the files** — `task-plan.md`, and `review.md`
or the plan where relevant. The disk is the truth; the report only describes it.

- **Report and disk agree** → continue to Step 5.
- **Report claims an advance the file doesn't show** → treat it as a stage
  failure, not a success. Dispatch the stage once more with the discrepancy
  named explicitly. If the second run also fails to move the ledger, stop the
  run (Step 6's no-progress guard).
- **`STATUS: blocked`** → stop the run and report. Don't retry a blocked stage
  and don't route around it.

Append a line to the run ledger and print it as you go, so a user checking in
mid-run can see where things are:

```
[3/~9] auto-implement      data-layer            complete   D4 D5(Low)   2 files
```

### Step 5: Sanity-check low-confidence decisions

For each entry the stage just appended to `decisions.md` with
**`Confidence: Low`**, dispatch one `general-purpose` reviewer subagent. Stage
subagents can't spawn subagents, which is exactly why this belongs to you.

The reviewer prompt carries: the decision entry verbatim, the artifact it
shaped (path + the relevant section), the governing plan text (`task-plan.md`'s
Definition of Done, or the plan's Contracts), and the repo root. Ask for one of:

- **`confirm`** — the decision is defensible on the evidence; a short why.
- **`revise`** — with the specific alternative it should have taken, and the
  evidence for it.

On **`revise`**, dispatch **one** amend run of the same stage, carrying the
reviewer's recommendation and the instruction to correct the artifact and update
that decision entry in place (noting it was revised on review). Then re-verify
disk state as in Step 4.

**At most one amend per stage**, regardless of how many `Low` entries it logged
or what the reviewer says about the amended result. Then move forward. Batch the
checks for one stage into a single message when there are several — they're
independent of each other.

### Step 6: Loop, and know when to stop

Return to Step 2 and route again. The run ends when any of these is true:

- **The task is complete** — every subtask `committed`, or the no-subtasks path
  finalized. Go to Step 7.
- **A stage returned `STATUS: blocked`.** Stop and report what blocked it.
- **No progress** — two consecutive dispatches for the same scope leave the disk
  state unchanged. Stop and report the stall. This is a correctness guard against
  a stuck loop, not a budget: there is deliberately **no step, retry, or cost
  ceiling** on this pipeline, so this is the only thing standing between a
  confused stage and an endless run.

Also honor one bounded loop-back: when `auto-triage-findings` reports that its
fixes were **architectural or wide-blast-radius** (a contract changed, a module
boundary moved, several files restructured), route back to
`auto-review-implementation` for that work-item — **once**. On the second pass,
continue forward regardless of what triage says, and note it in the final report.

### Step 7: Finish — PR/MR or report

How the run ends comes from the config's **Completion mode**, pre-authorized
back in `/init-workflow`, not from any runtime confirmation. `auto-finalize`
acts on it; your job is to report the result.

Print the full run ledger, then:

**Completion mode `open PR/MR`** — the branch was pushed and the PR/MR opened by
`auto-finalize`. Report its URL, the commits, and anything outstanding. If
`auto-finalize` reported the CLI missing or unauthenticated, say that it fell
back to report-only and give the ready-to-run command.

**Completion mode `report only`** (and any run that ended blocked or stalled) —
nothing was pushed. Report:

```
Task:        add-oauth-login          Status: complete | blocked | stalled
Stages run:  9    Amends: 1    Decisions: 12 (2 Low, both confirmed)
Commits:     a1b2c3d feat(auth): add token store
             e4f5g6h feat(auth): wire refresh middleware
Artifacts:   specs/tasks/add-oauth-login/
Decisions:   specs/tasks/add-oauth-login/decisions.md

Outstanding:
  - manual check — confirm the login redirect lands on /dashboard
  - F3 deferred (Major) — rate-limiting on the token endpoint

Ready to open the PR:
  gh pr create --title "…" --body-file …
```

Always surface these three, in every mode:

- **The `Low`-confidence decisions** and how their sanity checks landed. These
  are the calls most worth a human's eyes.
- **Deferred and skipped findings** — `auto-triage-findings` never uses
  `accepted` or `dismissed`, so anything it didn't fix is still genuinely open
  and needs a human to look at it.
- **Outstanding manual verification** the stages couldn't perform.

Then stop. Don't start another task and don't offer to.

## Completion mode

Read from `specs/workflow-config.md`'s `## Autopilot` section:

| Mode | What the run does at the end |
| --- | --- |
| **`open PR/MR`** | Pushes the branch and opens the PR/MR through the recorded CLI (`gh` / `glab`), with the decision-enriched body. Pre-authorized at config time — that's what makes it legitimate without asking. |
| **`report only`** | Commits locally, pushes nothing, opens nothing. Prints the ready-to-run command. |
| **Section absent** | **`report only`.** A project configured before this section existed never pre-authorized a push, so don't take one. Mention the absence in the final report and point at `/init-workflow` to set it. |

Outward-facing actions follow the config and nothing else. A run in `report only`
mode never pushes, opens a PR/MR, or transitions a tracker ticket, no matter how
finished the work looks.

## Notes

- **You route; stages work.** If you catch yourself reading source files,
  writing a plan, or editing code, stop — that belongs to a stage subagent. Your
  context holds routing state and nothing else, which is what lets a long run
  finish.
- **Disk is truth.** Never advance on a stage's report alone. The whole design
  rests on `task-plan.md` being the ledger, and a stage that thinks it committed
  something it didn't must not move the pipeline forward.
- **One stage at a time.** Stages are ordered and share one status file. There is
  nothing to run in parallel — only the sanity checks for a single stage batch.
- **No human moment mid-run.** Nobody is asked anything once the run starts, so
  the final report is the whole audit trail a user gets. Make it complete: what
  was decided, what was deferred, what still needs a human.
- **Blocked is a stop, not a detour.** A stage that can't proceed ends the run.
  Routing around a blocker produces a half-built task whose ledger claims it's
  done.
- **Resumable by design.** The state lives in `task-plan.md`, `review.md`, and
  `decisions.md`, not in your context. An interrupted run is picked up by running
  `/autopilot {task}` again — or by dropping back to the normal human-in-the-loop
  skills, which read the exact same artifacts.
