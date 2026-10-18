---
name: small-task
description: Complete a small development task in one run with planning questions, plan approval, implementation approval, and commit-message confirmation. Combines setup, design, implementation, verification, self-review, and finalization in specs/tasks/{task}/task.md. Use for a focused fix or feature that does not need the full task pipeline.
---

# /small-task — Plan, implement, and finalize a focused task

Use one combined record at `specs/tasks/{task}/task.md`, based on
[assets/task.md](assets/task.md) (resolve relative to this skill's directory).
Keep the brief, general plan, implementation detail, progress, decisions, approvals,
and actual results together. Do not create `task-info.md`, `task-plan.md`, separate
implementation plans, review reports, subtasks, or decision logs. Work through the
steps in this run; the full pipeline's hand-off and delegation contracts do not apply.
For unattended execution, use `/auto-small-task`, which replaces the interactive gates.

## 1. Resolve and inspect

- Require `specs/workflow-config.md`. If absent, stop and point to `/init-workflow`;
  do not initialize configuration implicitly. Read its git, changelog, tracker,
  Autopilot completion policy, project map, coding-standards references, and applicable local
  operation, verification, and diagnostics. Read applicable repository rules and
  inspect the affected code before choosing a solution. Check recorded tool and
  command availability in the current environment; do not treat old verification
  labels as a guarantee.
- Resolve the task from the explicit task name or description, then the current
  branch matched against the `Branch` in existing `task.md` records. Derive a safe
  lowercase hyphenated slug for a new task. Ask only when identity is ambiguous.
- Use the invoking message as the brief. Fetch configured tracker details when
  available, preserving the message's requirements; clarify material conflicts.
  Report unavailable integrations without inventing ticket details.
- If the folder exists, read its records before writing. Resume an existing
  `task.md`, preserving history, completed steps, approvals, and results. If it
  holds only full-pipeline artifacts, stop and recommend the appropriate pipeline
  command; never overwrite or silently convert them. If both formats exist and
  ownership is unclear, resolve that before making changes.
- Resume from the recorded next action after cross-checking git and results.
  Do not repeat completed steps or approvals for unchanged work. A committed task
  can retry outstanding completion actions under the current policy without a new
  implementation or commit. If a previous commit succeeded but the record update
  failed, reconcile it from git history before acting. Use the explicitly invoked
  mode and record any mode change; a switch to interactive execution still needs
  its approvals before any remaining implementation or commit.
- Inspect branch, HEAD, staged and unstaged diffs, and untracked files. Record the
  starting state and unrelated changes, including existing changes in files the
  task will touch. Preserve them throughout; never stash, reset, or discard them.
- For new work, create `task.md` from the bundled template and fill in the brief,
  mode, starting state, and current progress before planning. For resumed work,
  update the existing record instead of copying the template over it.
- Follow configured branch naming. Propose a name and base with the plan, allowing
  reuse of the current branch or no new branch. Create/switch only after approval
  and when existing work can be preserved. Record the actual branch and base.

## 2. Build and approve the general plan

Assess suitability: a focused change with an understandable design, bounded code
and interface changes, and verification that fits one coherent implementation.
If it needs independent increments, contested architecture, or a broad/risky
migration, explain why, recommend the full workflow (`/start-task` for new work),
record the hand-off in `task.md`, and stop. Reassess if scope grows during the run.
Do not convert records or start the full pipeline automatically.

Ask relevant planning questions grounded in codebase evidence. Skip questions
already answered by the brief or configuration. Write a concrete, reviewable plan:

- Goal, constraints, and acceptance criteria.
- Solution design, affected files/components, interface or data changes, and edge cases.
- Ordered implementation steps with enough technical detail to execute them.
- Verification commands, expected outcomes, and any required manual checks,
  using configured browser/API/data/log access where applicable.
- Meaningful decisions, rejected alternatives when useful, and assumptions.

Present the plan and branch choice, request **plan approval**, and wait before
implementation. Record what was approved and any revisions. Reuse a recorded
approval on resume only while its scope and design still match; material changes
require an updated plan and approval. Set progress to `implementing` when starting.

## 3. Implement, verify, and self-review

Carry out the ordered steps and update their progress in `task.md`. Record material
deviations and their reasons. Seek renewed plan approval before implementing a
material scope/design change; apply the suitability rule above if the task grows.

Run the planned automated checks and repository-required checks. Record exact
commands, actual outcomes, and relevant failure details; never label an unrun
check as passing. Distinguish existing failures from introduced failures with
evidence. Fix introduced failures and actionable self-review findings, then rerun
the affected checks. Review the diff against acceptance criteria and standards,
including regressions, interfaces, edge cases, and preservation of unrelated work.
Keep self-review findings and their resolution inline in `task.md`.

Perform manual checks where possible. Clearly list those still outstanding and
whether they gate completion. A required check that cannot be completed is a
blocker, not a pass. For a genuine blocker, record the cause, attempts, current
state, and exact next action; set progress to `blocked` and stop with a resumable
report. Do not finalize while introduced failures or actionable findings remain.

When implementation is ready, summarize the change, verification evidence,
deviations, and outstanding manual checks. Request **implementation approval**
and wait before finalization. Record the response. If changes are requested,
implement, verify, and self-review them before seeking approval again. Any later
material code change invalidates that approval.

## 4. Finalize

Confirm acceptance criteria, successful required checks, resolved findings, and
recorded approvals. Inspect the final staged/unstaged diff. Stage only task-related
changes and `task.md`; use hunk selection for mixed files. Preserve pre-existing
staged changes without including them in this commit. If separation cannot be
done safely, leave a blocked record instead of committing unrelated work.

Add any configured changelog entry in its configured location and format; include
it in this same completing commit. Skip if the project does not maintain one.
Generate a commit message following configured conventions, including tracker
references when required. Present the final change and message for **commit-message
confirmation** (proceed, edit, or skip). Wait for confirmation; skip leaves the task
ready to commit without advancing to `committed`.

Commit the isolated task changes with the confirmed message. Only after success
record `committed`, the message, branch, checks, and outstanding work. Include that
final record in the completing commit, amending only the local commit created by
this run and retaining its confirmed message if necessary. Identify it in the
record by branch and subject rather than embedding its own hash. If commit or
amend fails, report the actual state and leave a resumable record. On resume,
check git history and the record before retrying; do not duplicate commits.

## 5. Completion policy and report

Both shortcuts use `specs/workflow-config.md`'s **Autopilot** completion policy;
do not inherit `/finalize`'s extra remote-action prompt or dispatch `/autopilot`.

| Completion mode | Actions after the completing commit |
| --- | --- |
| `report only` | Commit locally and prepare PR/MR title, body, and exact push/create instructions. Do not push, open a PR/MR, or transition a tracker ticket. |
| `open PR/MR` | Perform configured push and PR/MR creation and configured tracker transition through the recorded mechanisms. Check tool availability/authentication first and check for an existing task PR/MR on resume to avoid duplicates. |
| Missing or unrecognized policy | Default to `report only` and report the fallback. |

If configured tooling is unavailable, fall back to a report with actionable
instructions. If a remote action fails after another succeeds, report each actual
outcome and the remaining actions; never claim rollback or completion that did
not happen. Remote-action failure does not erase a successful local commit.
Include meaningful decisions, verification results, and outstanding manual checks
in the prepared PR/MR body. Use a body file or structured argument for multiline
text. Record the policy and prepared completion details in `task.md` before commit;
report subsequent remote outcomes in the final response without amending a
published commit.

Finish with the task record path, result, commit hash if created, checks and manual
work remaining, unrelated changes left alone, and PR/MR link or instructions.
If incomplete, give the exact resume command `/small-task {task}` and the blocker
or pending approval. A fully completed rerun reports the existing result instead of
repeating implementation or finalization.
