---
name: plan-task
description: Use when a task workspace has been created by /start-task and the next step is high-level planning — brainstorms solution approaches with the user, surfaces tradeoffs, and decomposes the task into an ordered subtask plan (or declares it needs none). Writes task-plan.md. Run before /plan-implementation.
---

# /plan-task — Plan the task (high level)

Produce the high-level plan for a task: break it into an ordered subtask plan, or decide it needs none. Before writing anything, brainstorm with the user — explore approaches, surface tradeoffs, and reach alignment — so the breakdown reflects real decisions rather than guesses.

**Reads:** `specs/tasks/{task}/task-info.md`, `specs/coding-standards.md`, relevant codebase context
**Produces:** `specs/tasks/{task}/task-plan.md`

`task-plan.md` is the **single source of truth for task-level planning context and subtask status** throughout the rest of the workflow. Every downstream skill reads and updates it.

**Planning contract:** explore the codebase first, cluster related decisions into short question rounds, propose alternatives with tradeoffs, brainstorm until the coverage checklist is satisfied (not merely until you *could* write something), get user approval for the breakdown, then write `task-plan.md`. Do not write or update the plan artifact until the user approves the proposed Definition of Done and subtask split / no-subtasks choice.

## Process

### Step 1: Read context

Before asking anything, do the homework:

1. Check that `specs/workflow-config.md` and `specs/tasks/{task}/task-info.md` both exist. If the task folder is missing, stop and point the user to `/start-task`.
2. Read `task-info.md` fully — this is the task definition.
3. Read `specs/coding-standards.md` if present.
4. **If `task-plan.md` already exists**, read it — this is a resumed run. Show the current state and ask whether to continue from where things left off or restart planning.
5. Explore the codebase: use Glob and Grep to find files and patterns the task will touch. Look for existing conventions, similar features, and architecture constraints that should inform the breakdown.

Summarize findings in 3–5 bullets before moving on: what relevant code exists, what patterns apply, any early complexity signals. Don't ask the user for things the codebase already answers.

Before detailed questions, do a scope check. If the task spans independent deliverables or subsystems, call that out and steer toward a subtask split, or ask whether the task itself should be split before planning continues.

### Step 2: Brainstorm — cover the space thoroughly

Brainstorm in short, focused rounds. **Group 2–3 tightly related questions into one round** when they share context (e.g. three facets of the same approach decision); keep unrelated decisions in separate rounds so the user isn't overloaded. Prefer multiple choice when it helps the user decide quickly; use open-ended questions only when the answer space is genuinely unknown. After each round: capture the durable context that should survive into `task-plan.md`, then look for the next gap.

Start with the highest-leverage planning decision. If the implementation approach is uncertain, present 2–3 concrete options with tradeoffs and mark one recommended option. If scope, acceptance criteria, dependencies, risks, or decomposition are more uncertain than the approach, ask about that first instead. Approach recommendations must come from codebase research — not guessing.

**Coverage checklist — sweep all of this before you propose a breakdown.** Don't stop at the first plan you *could* write; keep going until each dimension is either settled or explicitly judged not-applicable:

- Scope — what's in vs. out
- Solution approach **+ the alternatives you considered and rejected**
- Edge cases and failure modes to handle
- Non-functional needs — performance, security, UX, compatibility (whichever apply)
- Risks & unknowns — anything needing investigation or a spike
- Dependencies / integrations
- Acceptance criteria (Definition of Done)
- Decomposition — how to slice the work

**When unsure whether you've covered enough, ask one more round.** Err toward more questions, not fewer.

**Question categories to draw from:**

| Category                                                    | Tag |
| ----------------------------------------------------------- | --- |
| Scope — what's in vs. out                                   | [D] |
| Solution approach — how to tackle the core challenge        | [S] |
| Edge cases — boundaries and failure modes to handle         | [S] |
| Non-functional requirements — perf, security, UX, compat    | [D] |
| Risk & unknowns — what needs investigation or a spike first | [S] |
| Subtask granularity — how to slice the work                 | [S] |
| Definition of done — overall acceptance criteria            | [D] |
| External dependencies / integrations                        | [D] |
| Breaking changes / migration concerns                       | [S] |

`[D]` = diagnostic (about the problem space); `[S]` = solution (about how to build it).

**Rules:**

- One round per AskUserQuestion call — up to 3 tightly related questions, 2–4 options each. Split unrelated decisions across rounds.
- For approach / tradeoff questions: mark exactly one option `⭐ Recommended`, format options as `[What this does.] · Strength: [advantage] · Tradeoff: [cost]`
- Don't ask what `task-info.md` already specifies — absorb it as a prior decision
- Don't ask for low-level implementation details — those belong to `/plan-implementation`
- After each round, check the coverage checklist: any dimension still open and relevant → ask about it next. Move to Step 3 only once the whole checklist is settled or explicitly not-applicable.

**After each answer**, keep track of the decisions, agent findings, constraints, risks, rejected alternatives, dependencies, and codebase observations that future workflow steps may need. These are not a chronological transcript; they become concise `Planning Notes` in `task-plan.md`.

### Step 3: Propose the breakdown

Present a short approval summary before writing the plan. Keep it concise: name the Definition of Done in one or two sentences, then list the proposed subtasks as ordered one-liners with slug + outcome. This is for alignment, not the final artifact, so don't mirror the full `task-plan.md` template here and don't include status headings yet.

Subtasks are implementation slices, not project-management phases. Each subtask must require adding or modifying code. Do not create separate subtasks for testing, manual verification, documentation-only review, rollout, or cleanup; include verification expectations in Definition of Done or in the implementation plan for the code-changing subtask they validate.

Keep the list coarse enough to guide implementation without turning into step-by-step instructions. A good subtask usually maps to one coherent code change or one reviewable implementation slice, not one function, one file edit, or one command. In the final plan, each subtask needs both a short filesystem-safe slug/status heading and a short description explaining what should be done in that step.

Design subtasks for independence: each one should have a clear purpose, a reviewable code outcome, and enough context that `/plan-implementation`, `/implement`, `/review-implementation`, and `/finalize` can operate on it without needing unrelated subtasks in progress.

**Merge pass — do this before presenting the list.** For each pair of adjacent subtasks, ask: _would a reviewer naturally review these together, in one sitting, as one change?_ If yes, merge them. Keep two subtasks separate only when at least one holds: they touch genuinely distinct code areas, one must land and be reviewed before the next can start, or combining them would produce a commit too large to review in one pass. Absent one of those, default to merging.

Do not create a separate code-areas section. Attach file or folder references directly to the plan text when the surrounding sentence refers to a specific area, likely change, important pattern, or constraint. This can be in the Definition of Done, a diagram explanation, a no-subtasks note, or any subtask description. Do not list every file searched.

**Prefer a diagram wherever it clarifies more than a paragraph would.** Include a Mermaid diagram before the subtask list whenever the approach involves a flow, an architecture boundary, a state transition, or data movement — reach for the visual first and fall back to prose only when a diagram would add nothing. Pick the type that fits: flow, sequence, state, component/dependency, or an ERD for data shape. The only thing to skip is a genuinely decorative diagram on trivial, linear work.

For a small task, propose the no-subtasks path in one sentence and include a concise Definition of Done summary. Leave the full no-subtasks artifact shape for Step 4.

Then, **in a plain message** (not an `AskUserQuestion`), invite the user to respond: reply to adjust the breakdown, Definition of Done, or approach, keep the task whole with no subtasks — or say go and you'll write `task-plan.md`. Let the user answer in free text.

Iterate until approved. The approval gate is strict: no `task-plan.md` write until the user approves the proposed Definition of Done and subtask split / no-subtasks choice.

### Step 4: Write the artifacts

**Write `specs/tasks/{task}/task-plan.md`:**

```markdown
# Task Plan: [Task Title]

## Task Summary

[1-3 sentences describing what this task changes and why. Mention files or folders inline only when they add useful context.]

## Definition of Done

[Overall acceptance criteria, written as **objective, testable statements** — each one names a behavior a reviewer can verify, not a vibe. Optional EARS phrasing where it fits: "When <trigger>, the system shall <response>." These are what /review-implementation and /finalize will check the whole task against. Mention relevant files or folders inline here when acceptance criteria are tied to specific code areas.

Close with a short **Out of scope / Non-goals** line naming what this task deliberately does not do, so later steps don't over-reach.]

## Planning Notes

[Optional. Capture durable context from planning: agent findings, user decisions, chosen approach, rejected alternatives when the reason matters, constraints, risks, dependencies, or important codebase observations. Keep it concise and useful for later workflow steps. Mention files or folders inline when they add context. Omit this section when Task Summary and Definition of Done already say enough.]

## Solution Diagram

[**Prefer a diagram here** whenever the approach involves a flow, architecture boundary, state transition, or data movement — a Mermaid visual usually beats a dense paragraph. Pick the type that fits: flow, sequence, state, component/dependency, or ERD for data shape. Add a short note with inline file/folder references if they help explain the boundary or flow. Omit this section only when the work is trivial/linear and a diagram would be purely decorative.]

## Subtasks

### 1. `subtask-a` — pending

[Short description of what should be done in this implementation slice, what it delivers, and any important files/folders such as `path/or/folder` when they help orient the work.]

### 2. `subtask-b` — pending

[Short description of what should be done in this implementation slice, what it delivers, and any important files/folders such as `path/or/file.ext` when they matter.]

### 3. `subtask-c` — pending

[Short description of what should be done in this implementation slice and what it delivers.]
```

For the no-subtasks path:

```markdown
# Task Plan: [Task Title]

## Task Summary

[1-3 sentences describing what this task changes and why.]

## Definition of Done

[Objective, testable acceptance criteria (optional EARS phrasing). Close with a short **Out of scope / Non-goals** line.]

## Planning Notes

[Optional. Capture durable context from planning. Omit this section when Task Summary and Definition of Done already say enough.]

## No Subtasks

This task will be handled in a single implementation pass. Mention important files or folders inline here only if they orient the work, for example `path/or/folder` because it contains the relevant pattern.
```

### Step 5: Self-review the plan

Before summarizing, read the written `task-plan.md` with fresh eyes and fix issues inline:

1. Remove placeholders, TBDs, and vague language.
2. Check that Definition of Done names observable, testable behavior or outcomes, and includes an Out of scope / Non-goals line.
3. Check that subtasks are implementation slices, not chores, phases, or verification-only tasks.
4. Check that Planning Notes contain durable context, not a chronological transcript.
5. Check that the plan stays high-level and does not include `/plan-implementation` details.

### Step 6: Summarize and hand off

```text
specs/tasks/{task-name}/task-plan.md    [created]

Subtasks: [N]   (or: no subtasks)
```

Close with the next step and stop — don't chain automatically:

> **Next step:** run `/plan-implementation` to turn the first subtask (or the whole task) into a step-by-step implementation plan.

## Subtask naming

Subtask names become folder names: lowercase, hyphenated, filesystem-safe (`add-auth-middleware`, `migrate-user-table`). Keep them short and descriptive — every downstream skill references subtasks by this slug.

## Subtask granularity

Subtasks are implementation-oriented slices. Every subtask must require adding or modifying code and should deliver a coherent, reviewable change. Avoid granular subtasks for individual helper functions, single-file edits, commands, or checklist chores unless that unit is genuinely the meaningful implementation boundary.

A subtask earns its own slot only when it represents a distinct reviewable boundary — a distinct code area, a hard sequencing dependency, or a chunk large enough that bundling it would make review unwieldy. If two candidate subtasks share the same area and could be reviewed together, they are one subtask.

Do not create separate subtasks for testing, manual verification, documentation-only checks, rollout, or cleanup. Capture those expectations in Definition of Done, or leave detailed verification steps for `/plan-implementation` within the code-changing subtask they belong to.

## The "no subtasks" decision

Choose "no subtasks" when: single clear deliverable, ≤2 distinct areas of the codebase, can be meaningfully reviewed and committed in one pass.

**Default to fewer, larger subtasks.** When unsure whether two slices are one subtask or two, make them one. Splitting later during `/plan-implementation` is cheap; an over-fragmented plan adds workflow overhead (a `/plan-implementation` + `/implement` + `/review-implementation` cycle per subtask) with no benefit. A typical task is 1–4 subtasks; treat 5+ as a signal to re-check whether some should merge.

## Notes

- **High-level only.** Don't detail HOW each subtask will be implemented — that's `/plan-implementation`'s job. Resist the urge to write implementation steps here.
- **Code references are contextual.** Do not create a standalone code-areas section. Reference files or folders inline only when they orient implementation, identify likely changes, or preserve important context from codebase research.
- **Prefer diagrams over dense prose.** Reach for a Mermaid diagram (flow, sequence, state, component/dependency, ERD) whenever the approach has a flow, boundary, or data shape a reader would otherwise have to reconstruct from a paragraph. Skip one only for trivial, linear work where it would be decorative.
- **Planning Notes are durable context, not a transcript.** Include what future agents need to understand why the task is shaped this way; omit conversational history that no longer matters.
- **Check task-info.md first.** If the task description already specifies approach or acceptance criteria, absorb it as a prior decision — don't make the user repeat themselves.
- **Subtask status lives here.** Downstream skills (`/plan-implementation`, `/implement`, `/review-implementation`, `/finalize`) update the status in each subtask heading as they progress. This is the only status ledger.
