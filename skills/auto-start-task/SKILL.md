---
name: auto-start-task
description: Autonomous counterpart to /start-task, for unattended /autopilot runs. Creates the specs/tasks/{task}/ workspace and branch with no questions asked — task identity comes from the dispatching prompt, the slug is derived rather than proposed, and the branch base is chosen from git state. Dispatched by /autopilot; not meant to be run by hand (use /start-task when a human is present).
---

# /auto-start-task — Start a task (autonomous)

**Derived from:** `../start-task/SKILL.md` — read it in full and follow it
exactly, **except** where the Overrides table below replaces a step.
**Autonomy contract:** `../autopilot/assets/autonomy-contract.md` — read it too.

You have no user. `AskUserQuestion` is unavailable, nobody will see a question,
and waiting for an answer hangs the run. Every place the core skill asks,
proposes for confirmation, or loops for clarification is replaced below.

## Overrides

| Core step | Autonomous replacement |
| --- | --- |
| **Step 2** — ask for the task identifier / what to work on | The dispatching prompt carries the task description or ticket reference. Treat it as the user's invoking message in the core skill's sense: it is a **source in its own right**, and it outranks the tracker. Fetch from the configured tracker exactly as the core skill says. |
| **Step 2** — `AskUserQuestion` on a message-vs-tracker conflict | Resolve toward the **prompt text**, per the core skill's own "user-supplied message input always wins". Log a decision naming both versions and which you took. Confidence: `Medium` normally, `Low` when the two disagree about the actual goal rather than a detail. |
| **Step 2** — loop with the user until the goal is clear | You cannot loop. State the **most defensible reading** of the goal, write it plainly in `task-info.md`, and log it as a decision at `Low` confidence naming the ambiguity and the interpretation you chose. Don't block — the coordinator's sanity check covers a `Low`. |
| **Step 3** — propose the slug, let the user adjust | Derive the slug and use it. Same rules: lowercase, hyphenated, filesystem-safe, no ticket id. No confirmation. |
| **Step 5** — `AskUserQuestion` for branch base and name | Decide from git state (see *Branch decision* below) and act. Record it on the **Branch** line in `task-info.md` — not a `decisions.md` entry. |
| **Step 6** — next-step line + clipboard copy | Return the stage report block from the autonomy contract instead. No `> **Next step:**` line, no clipboard, no invoking `/auto-plan-task`. |

Everything else in the core skill stands: the precondition check, the tracker
fetch and its graceful degradation, the `task-info.md` template and the rule
that **every detail from the prompt shows up in it**, the existing-workspace
resume behavior, and the Branch line.

## Branch decision

Follow the core skill's Step 5 detection (current branch, tree clean or dirty,
default branch, remote configured), then apply this instead of asking:

1. **Name** — from `workflow-config.md`'s branch-naming pattern; fall back to a
   repo rules file, then `feat/{slug}`.
2. **Base** — the up-to-date default branch when the working tree is **clean**
   and the fetch succeeds. If the fetch fails (offline, no remote), branch from
   the local default and say so on the Branch line.
3. **Dirty tree** — branch from **current HEAD**, carrying the changes along.
   Never stash, reset, checkout over, or otherwise move work you didn't create.
   Note it on the Branch line: the tree was dirty, so the branch was taken from
   HEAD.
4. **Already on a task-shaped branch** that matches the slug — reuse it rather
   than creating a second one.

Record the result on the **Branch** line in `task-info.md` exactly as the core
skill requires. **None of this is a `decisions.md` entry** — branch selection
is process mechanics driven by config and git state, and the Branch line is
already its complete record.

## Notes

- **The prompt is the ticket.** Everything the dispatcher passed you is
  first-class task content and belongs in `task-info.md` in full — not trimmed
  for brevity, not dropped because the tracker seemed to cover it.
- **Never fabricate tracker details.** An unavailable integration degrades to
  what the prompt says, transparently, exactly as the core skill requires. An
  autonomous run makes inventing plausible-looking ticket text more tempting and
  more damaging, not less.
- **Don't clobber a workspace.** A re-run on an existing task name resumes it and
  fills gaps. The coordinator routes resumed tasks here only when the workspace
  is incomplete.
- **A vague goal is a logged `Low`, not a stop.** `STATUS: blocked` is for
  genuine impossibility — a tracker reference that resolves to nothing at all and
  a prompt with no description to fall back on. Not for "the ticket is thin".
