---
name: auto-small-task
description: Complete a development task unattended using one specs/tasks/{task}/task.md record. Combines setup, planning, implementation, verification, self-review, and a local commit without questions or approval gates; follows configured Autopilot completion policy for remote actions. Use directly for the autonomous small-task shortcut, not as an autopilot pipeline stage.
---

# /auto-small-task — Complete a task unattended

Read [../small-task/SKILL.md](../small-task/SKILL.md) in full and follow its
combined-document workflow, except for the overrides below. Use its bundled
template and record **Mode: auto-small-task**. This skill runs directly, without
the full pipeline's artifacts, autonomy contract, coordinator, or delegation.

## Overrides

| Core behavior | Autonomous replacement |
| --- | --- |
| Resolve identity, ask for missing details or tracker conflicts | Use the prompt and codebase evidence. The prompt takes priority over conflicting tracker content; record the conflict and interpretation. Derive the slug. Resume a matching shortcut record without overwriting history. If task identity or goal cannot be determined, record/report a genuine blocker rather than prompting or inventing requirements. |
| Propose a branch and base | Reuse the recorded branch when safe. For new work, follow configured naming, falling back to `feat/{slug}`, and branch from current HEAD, preserving all existing changes. Record the choice. Do not reset, stash, or switch over unrelated work. A branch mismatch on resume must be resolved safely or reported as blocked. |
| Ask planning questions and obtain plan approval | Settle questions from the brief and inspected code. Write the general plan and meaningful decisions/assumptions with evidence in `task.md`, then implement. Mark approvals as not applicable because this run is autonomous, never as human-approved. |
| Recommend the full workflow and stop when task growth exceeds shortcut suitability | Continue within the shortcut, expanding design, implementation steps, acceptance criteria, and verification as needed while preserving the user's scope. Do not create subtasks or pipeline artifacts. Size alone is not a blocker; genuine technical or access blockers still stop the run. |
| Seek approval for material plan deviations | Update the combined plan and record the change, rationale, and assumptions before continuing. |
| Obtain implementation approval | Perform verification and self-review, fix introduced failures and actionable findings, and proceed when ready. Report manual checks that could not be performed; required incomplete checks block finalization. |
| Confirm the commit message | Generate a conventions-following message and commit task-only changes without confirmation. Keep the core finalization checks, changelog inclusion, and accurate progress updates. |
| Ask on ambiguity or a blocker | Make a defensible evidence-based decision when possible and record it. Otherwise leave a truthful, resumable blocked record and report the exact missing information/access or next action without asking or waiting. Never bypass execution permissions. |
| Final report and resume command | Report results and blockers without a question or interactive hand-off. For incomplete work give `/auto-small-task {task}` and the specific prerequisite to resume. |

Everything else in the core skill stands, including required workflow initialization,
repository standards, preservation of unrelated staged and unstaged work, resumed
task checks, self-review, fixing introduced failures before committing, and the
configured completion policy. Missing policy defaults to `report only`; unavailable
tooling falls back to a report. Record meaningful decisions in `task.md`, never in
a separate decision log. Do not dispatch the seven autonomous pipeline stages.
