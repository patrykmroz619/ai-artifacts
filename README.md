# Dev-workflow skills

26 reusable agent skills for development work, including task setup, planning,
implementation, review, finalization, and standalone audits. The repository
contains one collection, installed with the [Skills CLI](https://github.com/vercel-labs/skills).
See [workflow.md](workflow.md) for the workflow and its artifact contracts.

## Install

Run inside the project where you want to use the skills:

```bash
npx skills add patrykmroz619/ai-artifacts
```

The interactive installer lets you choose skills and target agents. To install
all 26 skills for Claude Code, Cursor, and Codex without prompts:

```bash
npx skills add patrykmroz619/ai-artifacts --skill '*' --agent claude-code cursor codex --yes
```

Useful variants:

```bash
# List available skills without installing.
npx skills add patrykmroz619/ai-artifacts --list

# Install one standalone skill for one agent.
npx skills add patrykmroz619/ai-artifacts --skill review-pr --agent codex

# Install the collection globally instead of in the current project.
npx skills add patrykmroz619/ai-artifacts --skill '*' --agent claude-code --global

# Copy files instead of linking to a shared canonical copy.
npx skills add patrykmroz619/ai-artifacts --skill '*' --agent cursor --copy

# Update installed skills using the Skills CLI.
npx skills update
```

The Skills CLI manages discovery, agent destinations, links/copies, and update
tracking. Its project destinations include `.agents/skills/` for Codex and Cursor,
and `.claude/skills/` for Claude Code. This repository
provides skill directories and templates; it does not inject rules into consumer
`CLAUDE.md` or `AGENTS.md` files. No custom package or scope argument is needed.

## Getting started

After installing, invoke `init-workflow` in your coding agent (for example,
`/init-workflow` in agents that expose skills as slash commands). It configures
`specs/workflow-config.md` and the task workspace. It inspects the project and
guides setup for local startup, tests, browser interaction, and data/log inspection
where applicable, recording verified commands without secrets.

Initialization also checks Context7 documentation access and guides setup or records a skip.
Context7 is optional: planning, implementation, research, and review prefer it when dependency
APIs, setup, or version-sensitive behavior need documentation. Agents reuse relevant results
and fall back to official docs when access or coverage is insufficient. Configure the MCP
connection using [Context7's client setup documentation](https://context7.com/docs/resources/all-clients);
installation of these skills alone does not configure it.

Then use the core pipeline:

```text
start-task -> plan-task -> plan-implementation -> implement
           -> review-implementation -> triage-findings -> finalize
```

Repeat the implementation-through-finalization steps for each work-item.
Existing task artifacts remain under `specs/`. Skill invocation syntax depends
on the agent; you can also request a skill by name in a prompt.

For a focused task after initialization, use `small-task` to combine setup,
planning, implementation, verification, self-review, and finalization. It asks
relevant planning questions and waits for plan approval, implementation approval,
and commit-message confirmation. `auto-small-task` runs the same shortcut unattended.
Both keep the brief, plan, progress, and results in `specs/tasks/{task}/task.md`,
and resume existing records. `workflow-status` recognizes both formats.

Interactive task growth beyond a focused change recommends the full workflow and
stops; autonomous growth expands the combined plan and continues. Both preserve
unrelated changes and use the configured Autopilot completion policy: `report only`
commits locally and prepares PR/MR instructions; `open PR/MR` permits configured
remote actions. Missing policy defaults to `report only`, and unavailable tooling
falls back to a report. These shortcuts do not require subagents.

## Available skills

| Skill | Purpose |
| --- | --- |
| `init-workflow` | Inspect the project, guide local verification setup, and initialize workflow configuration and task directories. |
| `start-task` | Capture a task and create its workspace and branch. |
| `small-task` | Plan, implement, verify, and finalize a focused task with approvals in one record. |
| `auto-small-task` | Run the combined task shortcut unattended, without approval gates. |
| `plan-task` | Define acceptance criteria and decompose the task. |
| `plan-implementation` | Write a technical plan for a work-item. |
| `implement` | Carry out the plan and verify the changes. |
| `review-implementation` | Review implementation, overengineering, architecture and code style; record findings. |
| `triage-findings` | Decide how to handle findings and apply approved fixes. |
| `finalize` | Commit the reviewed increment and prepare task completion. |
| `review-pr` | Review a PR or branch, including overengineering, architecture and code style. |
| `qa-scenarios` | Generate a manual QA handoff from changes. |
| `run-qa` | Confirm a testing scope, exercise running software, and write a report with evidence. |
| `workflow-status` | Report task progress and the next workflow step. |
| `conversation-audit` | Review the current agent conversation for evidenced workflow friction and recommend improvements. |
| `research-solution` | Research solution options through parallel agents. |
| `add-task-to-backlog` | Capture a new task in the configured backlog. |
| `autopilot` | Coordinate the autonomous workflow from start to finish. |
| `auto-start-task` | Start a task without interactive questions. |
| `auto-plan-task` | Define the task plan autonomously. |
| `auto-plan-implementation` | Write a work-item implementation plan autonomously. |
| `auto-implement` | Implement and verify without an acceptance conversation. |
| `auto-review-implementation` | Independently review an autonomous increment. |
| `auto-run-qa` | Verify changes that need live QA and add evidence and findings to the review. |
| `auto-triage-findings` | Resolve review findings autonomously. |
| `auto-finalize` | Commit and complete according to configured authorization. |

## Selective installation and dependencies

Install the full collection for the complete workflow. Individual core skills
may expect configuration or artifacts from earlier stages; installing a skill
does not initialize a workflow. `review-pr`, `qa-scenarios`, `run-qa`,
`research-solution`, and `conversation-audit` can be used without the task
pipeline. `add-task-to-backlog` and `workflow-status` read the project's workflow state.

The Skills CLI does not automatically install companion skills. Each of the eight
autonomous pipeline stages needs its core instructions plus the shared contract bundled with
`autopilot`:

| Autonomous skill | Required companions |
| --- | --- |
| `auto-start-task` | `start-task`, `autopilot` |
| `auto-plan-task` | `plan-task`, `autopilot` |
| `auto-plan-implementation` | `plan-implementation`, `autopilot` |
| `auto-implement` | `implement`, `autopilot` |
| `auto-review-implementation` | `review-implementation`, `autopilot` |
| `auto-run-qa` | `run-qa`, `autopilot` |
| `auto-triage-findings` | `triage-findings`, `autopilot` |
| `auto-finalize` | `finalize`, `autopilot` |
| `auto-small-task` | `small-task` (including its bundled template); no `autopilot` contract |

To install the autonomous shortcut and its core companion:

```bash
npx skills add patrykmroz619/ai-artifacts --skill auto-small-task small-task --agent codex
```

For a new project, install and run `init-workflow` first. The shortcuts require
`specs/workflow-config.md`; installation alone does not configure the project.

For example, to install the instructions required for just the implementation
stage:

```bash
npx skills add patrykmroz619/ai-artifacts --skill auto-implement implement autopilot --agent codex
```

Installing `autopilot` for its contract does not make the coordinator usable on
its own. To run the coordinator, install all eight autonomous stages and their
core companions:

```bash
npx skills add patrykmroz619/ai-artifacts --skill autopilot auto-start-task start-task auto-plan-task plan-task auto-plan-implementation plan-implementation auto-implement implement auto-review-implementation review-implementation auto-run-qa run-qa auto-triage-findings triage-findings auto-finalize finalize --agent codex
```

Use the same project/global scope and agent selection for companion skills so
their installed directories are siblings. Autonomous pipeline stages assume the full
collection is installed. For a new project, also install and run `init-workflow`. Autopilot needs
an agent runtime that supports subagents, and follows the completion mode in
`specs/workflow-config.md`.

## Migrating from the custom CLI

`npx @patryk.mroz/artifacts install <scope>` is retired. Reinstall the skills
using the command above; there are no artifact scopes. Skill names, templates,
and workflow state paths remain the same.

The former installer may have added `<!-- BEGIN registry:<scope> -->` through
`<!-- END registry:<scope> -->` blocks to consumer `CLAUDE.md` or `AGENTS.md`
files. Review those blocks manually and retain or remove them according to the
project's rules. The new installer does not manage or remove them. No changes to
existing `specs/` task state are necessary.

## Contributing

Each skill lives at `skills/<name>/SKILL.md` with YAML `name` and `description`.
Templates belong in that skill's `assets/` directory. Keep references relative
to the installed skill location. Autonomous pipeline stages assume the full collection is installed;
the autonomous shortcut needs only its core companion.
Do not commit installed third-party authoring skills.

Node.js 22 or newer is required for repository validation tooling:

```bash
npm ci
npm run validate
npm test

# Discover the source collection directly, excluding any local authoring tools.
npx skills add ./skills --list
```

In a clean checkout, `npx skills add . --list` also discovers the same 26 skills.
Test installs from a temporary consumer project with the absolute path to this
checkout as the source. CI validates frontmatter, names, collection membership,
bundled files, and companion references; it runs validation tests on pushes and
pull requests. This repository is private as an npm package and is distributed
from GitHub without a build or publishing step.
