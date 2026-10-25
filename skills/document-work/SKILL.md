---
name: document-work
description: Turn a task folder, PR, or specified implementation scope into durable project documentation. Confirm the exact scope with the user, then update or extend existing docs according to specs/documentation-guide.md. Use independently or from archive-task.
---

# /document-work — Document implemented work

Update durable project documentation using `specs/documentation-guide.md`. This is a standalone skill: it accepts an active or archived task folder, a PR/MR or branch, or a described implementation scope. It does not change source code, workflow phase, git history, tracker state, or the task's location.

## Resolve and confirm the scope

1. Require `specs/documentation-guide.md`. If absent, stop and direct the user to `/structure-documentation`; do not invent a structure or create the guide implicitly.
2. Resolve the requested input. For a task, read either `specs/tasks/{task}/` or `specs/archived-tasks/{task}/`, including `task.md` for a shortcut or the full pipeline's task, plan, implementation, and review records. For a PR/MR or branch, inspect its description and diff against its base. For a described scope, locate the relevant implementation and existing docs. Ask only if the input identifies several plausible scopes.
3. Compare the records with actual code and observable behavior available in the repository. Plans, review notes, and PR descriptions are leads, not proof that an intended behavior shipped. Identify release or merge status when it changes whether the docs should describe behavior as current.
4. Before writing, show the user a concise, concrete proposal: the behavior or decision to document, the existing pages to update or pages to create, any pages to retire, and what will remain outside this update. Ask for scope confirmation. Incorporate corrections and reconfirm a materially changed scope. This confirmation also applies when `/archive-task` invokes this skill.

## Update the docs

- Follow the guide's map and existing document style. Update the authoritative page rather than copying task notes into a new page. Create a document only when the guide calls for one and no suitable page exists. Preserve useful existing content and links.
- Explain the final behavior, constraints, user or operator steps, and decisions relevant to each document's audience. Summarize historical planning only when it remains useful; do not present rejected plans or unimplemented acceptance criteria as current behavior.
- Use current project evidence for concrete claims. When API or dependency behavior matters, follow repository documentation lookup rules, including Context7. Mark material uncertainty explicitly instead of inventing details.
- Check navigation and links, review the diff for duplicate or contradictory information, and report the updated documents and any verified no-change result. A no-change result is successful only when the relevant docs already describe the confirmed scope accurately.

If part of the confirmed scope cannot be documented accurately, report that part as incomplete. Do not claim completion or signal `/archive-task` to move a folder until the documentation scope is complete.
