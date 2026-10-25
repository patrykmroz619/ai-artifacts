---
name: archive-task
description: Archive a user-declared finished workflow task after documenting it. Run document-work with scope confirmation, then move the full task folder from specs/tasks to specs/archived-tasks while preserving history and links. Standalone; does not finalize, merge, or commit work.
---

# /archive-task — Document and archive a finished task

Move one user-declared finished task from `specs/tasks/{task}/` to `specs/archived-tasks/{task}/`. This is a standalone action after the normal workflow, not a new task phase or an automatic `/finalize` or `/autopilot` stage. A merge, PR, or `committed` phase is useful context but is not an eligibility gate; the user decides when a task is finished.

Read [the documentation skill](../document-work/SKILL.md) and use its process for the documentation step. Require `specs/documentation-guide.md`; if it is missing, stop and point to `/structure-documentation`. The full collection is assumed installed.

## Resolve and document

1. Resolve one exact active task from the user argument, or from branch and task records if unambiguous. Accept full pipeline and `small-task` / `auto-small-task` folders. Inspect the whole folder, git status, and any completion evidence; report unfinished or conflicting records to the user without silently changing them. Do not archive multiple tasks from an ambiguous request.
2. Check that the destination does not already exist and that the source and destination resolve within the intended `specs` directories. Preserve unrelated staged, unstaged, and untracked changes. If this task is already archived, report its location and do not duplicate it.
3. Run `/document-work` for this task, including its explicit documentation scope confirmation. Continue only when that skill reports the confirmed scope complete. Existing accurate docs may yield a verified no-change result. If documentation is incomplete or the user declines the scope, leave the task folder active.

## Move and verify

1. Before moving, find references to the task folder and relative links within it. Plan the necessary link repairs; do not change unrelated documents. Check for destination collisions, unsafe path assumptions, and changes made since the preflight.
2. Move the **entire** task directory, including nested work items, evidence, and untracked files, to `specs/archived-tasks/{task}/`. Use a filesystem move that does not stage or commit changes on the user's behalf. Do not flatten or rewrite the task's historical records.
3. Repair links affected by the path change, verify the moved contents and relevant references, and inspect git status to ensure unrelated work remains untouched. If the move or required link repair cannot be completed safely, restore the task folder to its original location when possible and report what remains; do not call the archive complete.
4. Report the archive path, documentation updated (or the verified no-change result), link repairs, and any existing completion caveats. Do not push, open a PR/MR, transition a tracker ticket, or invoke another workflow stage.
