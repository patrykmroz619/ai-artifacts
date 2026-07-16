---
name: add-task-to-backlog
description: Add a new task to the backlog in the project's configured task-management tool. Use whenever the user wants to log/file/capture an idea or follow-up as a new ticket without starting work on it now — e.g. "add this to the backlog", "file a ticket for X", "log a task to fix Y later". Reads specs/workflow-config.md for the tracker's system and access mechanism, gathers the task's title/description from the user, confirms it with them, and creates it via the recorded MCP server, CLI, or REST access — falling back to printing the details for manual filing if no tracker is configured or it's unavailable. Standalone — does not create any other workflow artifacts.
---

# /add-task-to-backlog — Log a new backlog item

Capture a short idea or follow-up and file it as a new item in whatever task-management tool the
project uses — without opening a local workspace, without a branch, without starting work on it now.
This is a quick "don't lose this" capture, not the start of a planning cycle.

## Process

### Step 1: Read the tracker config

Look for `specs/workflow-config.md`. If it exists, read the **Task management** section and keep
System, Access mechanism, Availability, and Notes in mind for the rest of the run. If `specs/` or the
config file doesn't exist, that's fine — this skill has no hard precondition; it just means there's no
tracker to target, so you'll end up on the manual-filing path in Step 4.

### Step 2: Gather the task

Ask the user for a short title and description of the backlog item — a sentence or two is enough. If
their opening message already gave you this, don't re-ask.

If the user volunteers extra details the tracker commonly supports (priority, labels, project/board),
capture those too. Don't interrogate for fields they didn't mention; title and description are enough
by default.

### Step 3: Confirm before writing

Show the user the exact title/description that will be filed (and the target tracker, if one is
configured), then use `AskUserQuestion` to get explicit approval — proceed, edit first, or cancel —
before anything is written. This step is mandatory on every run, tracker or not: never create a
tracker item, and never treat manual-filing text as final, on an implicit go-ahead from Step 2 alone.

### Step 4: Create it, or fall back to manual

- **If a tracker is configured (System is not "none") and available**: once approved, create the item
  through the recorded access mechanism (MCP server, a CLI such as `gh issue create`, or REST), using
  the Notes field for any project/board/repo identifiers it needs.
  - If the integration is configured but turns out to be unavailable (auth expired, MCP tool absent,
    network down), say so and fall back to manual filing — don't silently drop the task.
- **If no tracker is configured, or it's unavailable**: don't create any local file. Print the
  approved title/description back to the user clearly so they can file it by hand, and say why (no
  tracker configured, or the integration isn't reachable right now).

### Step 5: Report the result

Print a short status line: the created item's ID/link (tracker case), or "not filed — no tracker
configured" / "not filed — integration unavailable" (manual case). This is a standalone utility — stop
here; there's no pipeline chaining or "Next step" pointer to another skill.

## Notes

- **Logging, not starting work.** This creates a backlog entry only — it never creates a local
  workspace or a branch.
- **Honor the configured integration, degrade honestly.** Use the tracker when it's genuinely
  available, and fall back to manual, visible-to-the-user output otherwise — never fabricate a ticket
  ID or pretend something was filed.
- **Always confirm before writing, tracker or not.** Step 3 is mandatory on every run — show the exact
  title/description and get explicit approval via `AskUserQuestion` before creating a tracker item or
  declaring manual text final.
