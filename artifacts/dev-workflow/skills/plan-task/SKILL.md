---
name: plan-task
description: Use when a task workspace has been created by /start-task and the next step is high-level planning — brainstorms solution approaches with the user, surfaces tradeoffs, and decomposes the task into an ordered subtask checklist (or declares it needs none). Writes task-plan.md and decisions.md. Run before /plan-implementation.
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
---

# /plan-task — Plan the task (high level)

Produce the high-level plan for a task: break it into an ordered subtask checklist, or decide it needs none. Before writing anything, brainstorm with the user — explore approaches, surface tradeoffs, and reach alignment — so the breakdown reflects real decisions rather than guesses.

**Reads:** `specs/tasks/{task}/task-info.md`, `specs/coding-standards.md`, relevant codebase context  
**Produces:** `specs/tasks/{task}/task-plan.md` · `specs/tasks/{task}/decisions.md`

`task-plan.md` is the **single source of truth for subtask status** throughout the rest of the workflow. Every downstream skill reads and updates it.

## Process

### Step 1: Read context

Before asking anything, do the homework:

1. Check that `specs/workflow-config.md` and `specs/tasks/{task}/task-info.md` both exist. If the task folder is missing, stop and point the user to `/start-task`.
2. Read `task-info.md` fully — this is the task definition.
3. Read `specs/coding-standards.md` if present.
4. **If `task-plan.md` already exists**, read it — this is a resumed run. Show the current state and ask whether to continue from where things left off or restart planning.
5. Explore the codebase: use Glob and Grep to find files and patterns the task will touch. Look for existing conventions, similar features, and architecture constraints that should inform the breakdown.

Summarize findings in 3–5 bullets before moving on: what relevant code exists, what patterns apply, any early complexity signals. Don't ask the user for things the codebase already answers.

### Step 2: Brainstorm — iterative Q&A

Ask questions in rounds. After each round: append the resulting decisions to `decisions.md`, then judge whether you have enough clarity to propose a breakdown. If gaps remain — open questions about approach, scope, unknowns, or acceptance criteria — start another round. Stop when you can confidently write `task-plan.md`, not before.

**Always open Round 1 with a solution approach question** (unless the approach is already unambiguous from the task description and codebase research). Propose **2–3 concrete approaches** with a ⭐ Recommended pick grounded in what the codebase actually favors:

```yaml
AskUserQuestion:
  question: "Which approach should we take for [the core challenge]?"
  header: "Approach"
  options:
    - label: "⭐ Recommended: [Option A]"
      description: "[What it does.] · Strength: [key advantage] · Tradeoff: [key cost or risk]"
    - label: "[Option B]"
      description: "[What it does.] · Strength: [advantage] · Tradeoff: [cost]"
    - label: "[Option C]"
      description: "[What it does.] · Strength: [advantage] · Tradeoff: [cost]"
```

The recommendation must come from codebase research — not guessing.

**Question categories to draw from:**

| Category | Tag |
| --- | --- |
| Scope — what's in vs. out | [D] |
| Solution approach — how to tackle the core challenge | [S] |
| Risk & unknowns — what needs investigation or a spike first | [S] |
| Subtask granularity — how to slice the work | [S] |
| Definition of done — overall acceptance criteria | [D] |
| External dependencies / integrations | [D] |
| Breaking changes / migration concerns | [S] |

`[D]` = diagnostic (about the problem space); `[S]` = solution (about how to build it).

**Rules:**

- One topic per AskUserQuestion call, 2–4 options per question
- For approach / tradeoff questions: mark exactly one option `⭐ Recommended`, format options as `[What this does.] · Strength: [advantage] · Tradeoff: [cost]`
- Don't ask what `task-info.md` already specifies — absorb it as a prior decision
- Don't ask for low-level implementation details — those belong to `/plan-implementation`
- After each round, ask yourself: *"Could I write a confident task-plan.md right now?"* If yes, move to Step 3. If not, identify the remaining gaps and run another round targeting them.

**After each round**, append to `decisions.md`:

```markdown
## Round [N] — [YYYY-MM-DD]

- **[Topic]**: [Decision made] — [brief rationale]
- **[Topic]**: [Decision made] — [brief rationale]
```

Never overwrite prior entries; the log shows the progression of thinking.

### Step 3: Propose the breakdown

Present the plan before writing it:

```markdown
Here's the breakdown I'm proposing:

**Definition of Done:** [overall acceptance criteria — what does "task complete" mean?]

**Relevant Code Areas:**
- `path/or/folder` — [why it matters: will change, important pattern, or constraint]

**Subtasks (ordered):**
1. subtask-a — [one line: what it delivers]
2. subtask-b — [one line: what it delivers]
3. subtask-c — [one line: what it delivers]
```

Subtasks are implementation slices, not project-management phases. Each subtask must require adding or modifying code. Do not create separate subtasks for testing, manual verification, documentation-only review, rollout, or cleanup; include verification expectations in Definition of Done or in the implementation plan for the code-changing subtask they validate.

Keep the list coarse enough to guide implementation without turning into step-by-step instructions. A good subtask usually maps to one coherent code change or one reviewable implementation slice, not one function, one file edit, or one command.

Include only the file/folder references that matter for orientation: areas likely to change, shared modules with important patterns, or code that constrains the design. Do not list every file searched.

If a visual would materially clarify the approach, include an optional Mermaid diagram before the subtask list. Use it for non-trivial flows, architecture boundaries, state transitions, or data movement; skip it for linear or obvious work.

Or, for a small task:

```markdown
**No subtasks** — this task is small enough to handle in one implementation pass.

**Definition of Done:** [acceptance criteria]

**Relevant Code Areas:**
- `path/or/folder` — [why it matters]
```

Then get approval:

```yaml
AskUserQuestion:
  question: "Does this breakdown look right?"
  header: "Breakdown"
  options:
    - label: "Looks good — write the plan"
      description: "Proceed with this breakdown."
    - label: "Adjust subtasks"
      description: "I want to reorder, split, or merge some entries."
    - label: "Revisit the approach"
      description: "The breakdown implies the wrong approach. Let's go back to Step 3."
    - label: "No subtasks — keep it whole"
      description: "This is simple enough for a single pass."
```

Iterate until approved.

### Step 4: Write the artifacts

**Write `specs/tasks/{task}/task-plan.md`:**

```markdown
# Task Plan: [Task Title]

## Definition of Done

[Overall acceptance criteria. Be specific: name behaviors, not vibes.
These are what /review and /finalize will check the whole task against.]

## Relevant Code Areas

- `path/or/folder` — [why it matters: will change, important pattern, or constraint]
- `path/or/file.ext` — [why it matters]

[Include only important references discovered during codebase research, not every file checked.]

## Solution Diagram

[Optional. Include a Mermaid diagram only when it helps explain a non-trivial flow, architecture boundary, state transition, or data movement. Omit this section entirely when a diagram would be decorative.]

## Subtasks

- [ ] subtask-a — pending
- [ ] subtask-b — pending
- [ ] subtask-c — pending
```

For the no-subtasks path:

```markdown
# Task Plan: [Task Title]

## Definition of Done

[Acceptance criteria.]

## Relevant Code Areas

- `path/or/folder` — [why it matters]

## No Subtasks

This task will be handled in a single implementation pass.
```

**`decisions.md`** should already exist from Step 3 rounds. If it doesn't (task was trivial / single-round), create it now with the decisions from the planning session.

### Step 5: Summarize and hand off

```text
specs/tasks/{task-name}/task-plan.md    [created]
specs/tasks/{task-name}/decisions.md    [created | updated]

Subtasks: [N]   (or: no subtasks)
```

Close with the next step and stop — don't chain automatically:

> **Next step:** run `/plan-implementation` to turn the first subtask (or the whole task) into a step-by-step implementation plan.

## Subtask naming

Subtask names become folder names: lowercase, hyphenated, filesystem-safe (`add-auth-middleware`, `migrate-user-table`). Keep them short and descriptive — every downstream skill references subtasks by this slug.

## Subtask granularity

Subtasks are implementation-oriented slices. Every subtask must require adding or modifying code and should deliver a coherent, reviewable change. Avoid granular subtasks for individual helper functions, single-file edits, commands, or checklist chores unless that unit is genuinely the meaningful implementation boundary.

Do not create separate subtasks for testing, manual verification, documentation-only checks, rollout, or cleanup. Capture those expectations in Definition of Done, or leave detailed verification steps for `/plan-implementation` within the code-changing subtask they belong to.

## The "no subtasks" decision

Choose "no subtasks" when: single clear deliverable, ≤2 distinct areas of the codebase, can be meaningfully reviewed and committed in one pass. If in doubt, prefer a small subtask list — it's easier to collapse subtasks than to split a large commit after the fact.

## Notes

- **High-level only.** Don't detail HOW each subtask will be implemented — that's `/plan-implementation`'s job. Resist the urge to write implementation steps here.
- **Relevant code areas are selective.** Reference files or folders only when they orient implementation, identify likely changes, or preserve important context from codebase research.
- **Diagrams are optional.** Use Mermaid only when it explains something a short paragraph cannot; omit it for straightforward tasks.
- **Decisions log is cumulative.** Append to `decisions.md` after each Q&A round; never overwrite prior entries.
- **Check task-info.md first.** If the task description already specifies approach or acceptance criteria, absorb it as a prior decision — don't make the user repeat themselves.
- **Subtask status lives here.** Downstream skills (`/plan-implementation`, `/implement`, `/review`, `/finalize`) update the checklist in `task-plan.md` as they progress. This is the only status ledger.
