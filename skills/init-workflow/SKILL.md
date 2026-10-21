---
name: init-workflow
description: Initialize or complete a project's dev-workflow configuration. Inspect how the app runs and can be verified, check Context7 documentation access, guide setup of useful tools, and record project-specific commands alongside tracker, git, changelog, and coding conventions in specs/workflow-config.md. Use for /init-workflow, setting up the dev workflow, or completing an existing workflow configuration.
---

# /init-workflow — Initialize the dev-workflow

Set up `specs/` — the committed, single source of truth for every dev-workflow artifact — and
capture project-level configuration that downstream skills use to run and verify the app and to
integrate with your task tracker, git, and changelog.

This runs **once per project**, but is safe to re-run. It is idempotent in spirit: it never clobbers
content you've already written. When an artifact already exists, it doesn't blindly skip it — it
**reads it, checks whether the expected information is present, and fills any gaps** (collaborating
with you when a gap needs your input). So a re-run on a half-configured project completes it rather
than leaving holes.

## What it produces

```
specs/
├── workflow-config.md # project operation and verification, plus workflow conventions
└── tasks/
    └── .gitkeep # keeps the (initially empty) tasks/ dir tracked in git
```

`specs/` is meant to be **committed** — it's living documentation that travels with the repo, so
teammates and future agent sessions share the same source of truth.

## Process

### Step 1: Scaffold the directory structure (create or complete)

For each artifact: if it's missing, create it from the template below. If it already exists, **read
it and reconcile** — confirm the expected sections/fields are present, and fill in anything missing
rather than overwriting what's there. Note the outcome (`created`, `completed`, or `present`) for the
final summary. This matters because the user may have partially filled an artifact, and a re-run
should finish the job, not erase it.

**`specs/tasks/`** — create the directory, and add an empty `.gitkeep` inside it so the otherwise-empty
dir is tracked in git. /start-task populates it later (one folder per task); the per-task layout is
documented there and in the workflow design, so no README is needed here.

**`specs/workflow-config.md`** — filled in Step 2. If it already exists, don't recreate it; instead
read it and check each applicable section (task management, git conventions, changelog, autopilot,
coding standards, project map, local operation, verification, inspection, and documentation lookup) for completeness. A
config written
before a section existed simply lacks it — that's a gap to fill, not a reason to leave it out. Run
the interview **only for sections that are missing or incomplete**, and ask before changing content
the user already filled in. If it is fully populated, show it and ask whether to keep it as-is or
revisit anything. Omit inapplicable operational sections; absence alone is not a gap for a project
without that surface.

Recheck Context7 availability in the current session even when the config is complete;
saved configuration is not proof of working access. Preserve user-written setup details and
choices, and propose updates when the observed status differs.

### Step 2: Inspect the project, then interview to fill `workflow-config.md`

The goal is to record *how* this project's workflow integrates with the outside world, so later
skills can auto-fetch task data, propose branch names, start and exercise the app, inspect results,
and prompt for changelog entries — and degrade gracefully when an integration isn't available.

Before the interview, inspect likely sources: README and contribution docs, agent/rules files,
package/build manifests and scripts, test/CI configuration, service or container definitions,
environment examples, migrations/seed scripts, and existing browser/API tooling. Identify the app
surfaces, main code entry points and component boundaries, dependencies, local run and test commands,
likely ports and health checks, data stores,
logs, and safe test-data paths. Read relevant files rather than scanning secrets or large generated
directories. Cite the source path beside information that may change. Distinguish a command found in
the repo from one you actually ran. Ask only about gaps, ambiguous choices, and access the repo
cannot establish; present discovered commands as defaults.

**Prefer the `AskUserQuestion` tool to put questions to the user** — present the choices (system,
access mechanism, changelog yes/no, etc.) as selectable options rather than asking in free-form prose.
It keeps the interview fast and unambiguous, and the user can always pick "Other" to supply something
not listed (which is how they name a tracker you didn't offer). Fall back to plain prose only for
genuinely open-ended details that don't fit options well, such as a project/board key or custom
branch pattern. Do not ask users to paste credentials into chat or the committed config; record
secret names and where they are supplied instead.

Ask in **small batches** rather than one giant form — group related questions into a single
`AskUserQuestion` call, let earlier answers inform later ones, and keep it conversational. Cover the
existing five areas plus applicable local operation, verification, and documentation lookup:

**1. Task management.** Which system, if any. **Ask the user first — never infer the tracker from
what tooling happens to be installed.** Do *not* scan for available MCP servers, CLIs (`gh`, `linear`,
`jira`, etc.), or env vars and then assume the project uses that tracker. The presence of a tool says
nothing about which tracker this project actually uses; only the user knows that. So lead with the
question, not a detection sweep.

Offer Jira, Linear, and GitHub Issues as common examples, but make clear these are only examples —
**the user can name any other tracker** (e.g. Azure DevOps, Asana, Trello, Shortcut, a self-hosted
tool) or choose "none". Only **after** the user has named the tracker (or "none") do you look at
tooling — and then only for *that* tracker: help them wire it up by asking how the agent should access
it — an MCP server, a CLI such as `gh`, a REST API, or manual entry — and walk them through whatever
configuration that mechanism needs (auth, base URL, project/board key, required env vars or tokens).
For a system you don't have a built-in integration for, work with the user to find a usable access
path; if none exists, fall back to manual and record exactly what the user will paste in by hand.

> **Verify availability before recording it.** Once the user has chosen a tracker and an access
> mechanism, confirm that mechanism actually works before recording it — a configured-but-unreachable
> integration is worse than honest "manual", because downstream skills will keep trying it. (This
> check is for the tracker the user picked; it is not a license to go discover trackers by scanning.)
> Check first:
> - **CLI (e.g. `gh`)** — confirm it's installed and authenticated, e.g. `gh auth status`.
> - **MCP server** — check whether the corresponding MCP tools are actually available in this
>   session.
> - **REST API / other** — confirm the credentials and endpoint actually resolve before trusting them.
>
> If the chosen mechanism isn't available, tell the user what's missing and ask them to either
> configure it now or fall back to manual. Record whatever is *actually* usable. Put each access
> detail (endpoint, project key, auth method, secret name) on its own task-management bullet
> (`key: value`) so downstream skills can reach the tracker.

**2. Git conventions.** Branch naming pattern and commit style. If the repo already has rules files
(e.g. `CLAUDE.md`, `AGENTS.md`, `.cursor/rules`) that specify these, read them and propose those as
defaults rather than asking cold.

**3. Changelog.** **First detect, then ask.** Scan the repo for an existing changelog before
prompting — look for common names at the root and a level or two down (e.g. `CHANGELOG.md`,
`CHANGELOG`, `HISTORY.md`, `CHANGES.md`, `NEWS.md`, a `changelog/` or `changes/` directory, or
changeset tooling like `.changeset/`). Let the finding shape the question:
> - **If a changelog file is found** — don't ask whether one exists. Tell the user what you found,
>   peek at its format (e.g. Keep a Changelog, plain dated entries, changesets), and confirm it's the
>   one the workflow should append to. Record its path and format as the two Changelog bullets.
> - **If none is found** — ask whether the project maintains a changelog (perhaps elsewhere) or wants
>   to start one. Only capture the two Changelog bullets if they say yes.
>
> Whether a changelog section ends up in the config is what tells /finalize whether and where to add
> an entry.

**4. Autopilot.** `/autopilot` runs the whole task pipeline unattended, and it never stops to ask —
so how far it's allowed to go has to be decided **here, in advance**. It always commits locally. The
question is whether it may also **push the branch and open a PR/MR** when it finishes a task.
The same completion policy governs `/small-task` and `/auto-small-task`; explain
that the choice also pre-authorizes their configured remote completion actions.

**Detect first, then ask**, as with the changelog: check whether a remote is configured and whether
`gh` or `glab` is installed and authenticated (`gh auth status` / `glab auth status`). Then offer the
two modes with their honest consequences:

> - **Open PR/MR** — the run ends with a pushed branch and an opened PR/MR whose body carries the
>   decisions the agents made. Fastest, and the review happens on the PR. Requires a working CLI.
> - **Report only** — the run commits locally and stops there, printing the exact `gh pr create` /
>   `glab mr create` command. Nothing leaves the machine without a human running that command.

Record the choice and remote host on the template's **Mode** and **Host** bullets. Put base
branch, draft vs ready, reviewers, and labels on their own bullets — one fact each.

Two rules carry over from area 1: **only record what's actually available** — don't set `open PR/MR`
against a CLI that isn't authenticated, or `/auto-finalize` will fall back to report-only anyway; and
**don't infer the answer from installed tooling** — a working `gh` says nothing about whether the
project wants an agent pushing to it. Ask.

If the user doesn't use `/autopilot` at all, `report only` is the right record — it's also what an
absent section means, so downstream behavior is identical either way.

**5. Coding standards.** Scan the repo's rules/instruction files — e.g. `CLAUDE.md`, `AGENTS.md`,
`.cursor/rules/` (`.mdc` files), `.cursorrules`, `.github/copilot-instructions.md`, `.windsurfrules`
— for anything that reads like a coding standard (language idioms, naming, formatting, testing, error
handling, file layout). If you find any, **reference the source files rather than copying their
content** — those files stay authoritative; the config's `## Coding standards` section just points
the workflow at them. Fill it with one bullet per file (path + a one-line note on what it covers). If
nothing relevant was found, leave the section out of the written config entirely.

Don't ask the user to restate or duplicate what the referenced files already say — referencing them
is enough. This isn't a place for a separate list of extra conventions: if the project wants more
standards enforced, they belong in a rules file, not duplicated into workflow config.

If `workflow-config.md` already has a `## Coding standards` section, leave the user's content alone —
at most append references to rules files not already mentioned there, and tell the user.

**6. Project map and local operation.** One bullet per app or service (`purpose` and entry path),
and one bullet per authoritative doc path. Do not copy a README or spec. For the local or disposable
test environment, one bullet each for a prerequisite, setup command, start command, readiness check,
stop command, and environment variable name plus where it is supplied (never the value). Repeat a
bullet when there are several. One **Status** bullet: `verified`, or `not verified` / `not configured`
with a few words of reason. Test a safe readiness path when feasible. Document staging only when the
project defines a safe staging environment and the user wants it used. Do not assume access to
production or real user data.

**7. Verification and inspection.** One bullet per existing check command (unit, integration,
end-to-end, lint, type, build), with its prerequisite and `verified` or `not verified` on that same
bullet. One bullet for where results appear. For each applicable interface, one bullet: browser tool
and fallback for web UI, request command and base URL for APIs, invocation for CLIs, and trigger plus
observable output for jobs. For browser work, use a dedicated browser tool provided by the current
agent runtime when it is suitable; otherwise use existing agent-usable project tooling or offer the
[official Playwright CLI](https://playwright.dev/agent-cli/introduction) (`@playwright/cli`). Check
the current installation instructions before proposing a command. Record the exact invocation and
a fallback when a runtime-specific tool will not be available to another agent. Verify a harmless
local interaction before marking browser access available; installed but untested means `not verified`.

For persisted behavior, one bullet for the data source and its read-only client, admin endpoint, or
sample query. One bullet per fixture role and its seed or reset command, without passwords. One
bullet each for a log path or command and a job-failure command. Confirm read-only access or a
harmless sample query when feasible. Point at project docs instead of copying a schema or log dump.
One **Missing** bullet per unavailable check, with the next action; omit it when nothing is missing.

**8. Documentation lookup (Context7).** Check Context7 separately from tracker discovery;
the tracker restriction above does not prevent this check. Look for the current session's
Context7 MCP tools (`resolve-library-id` and `query-docs`, possibly client-prefixed). If they
are absent or fail, inspect only relevant MCP client configuration when accessible, without
printing credentials. Do not infer that Context7 is unconfigured solely because no tools are
exposed; distinguish missing configuration from configured-but-unavailable access. If the
client cannot be established from the environment, ask which client the user wants configured.

Verify working access with a focused, read-only documentation lookup for a dependency found
in the project. Resolve its library ID, then query a relevant concept targeting the installed
version when available. For projects without dependencies, use a small lookup for a named
public library as a connectivity check, explicitly unrelated to project requirements. Only
a successful documentation response warrants `verified`. If no matching project/version docs
exist, distinguish that coverage gap from a connection failure; a successful public-library
lookup can verify access while the project-specific limitation remains recorded.

When Context7 is missing or broken, explain that it supplies current library documentation
for planning, implementation, and review. Offer guided setup now or a documented skip. Before
proposing commands, consult the current client-specific setup instructions linked from the
[official Context7 MCP documentation](https://context7.com/docs/resources/all-clients).
Show the exact proposed command/configuration change and its project or user scope; follow
the guided-setup approval rule below before making changes. Let the user supply credentials
through the client's supported authentication flow or secret configuration, never through
chat or the committed workflow config. If setup requires a restart/reconnect, explain that
step and leave access `not verified` until the tools are exposed and a lookup succeeds.

Always record `## Documentation lookup` as four short bullets: **Context7** status (`verified`,
`not verified` plus a few words of reason, or `not configured`), **Client** and config path,
**Check** (library and version or coverage caveat), and **Next** (missing prerequisite, reconnect
step, or documented skip with the official setup link). Omit **Next** when there is nothing to do.
`not verified` includes configured-but-unavailable access and inability to inspect configuration;
say which. `not configured` requires confirmed missing setup. Record a user's skip and the official
setup link so initialization can finish without Context7. On reruns,
recheck availability, preserve existing details and skips, and avoid repeating an unchanged
setup offer the user already declined. This is optional documentation access, not QA coverage
or a prerequisite for downstream work; later skills must check their own session availability.

**9. Guided setup.** For a missing relevant tool or prerequisite, explain the concrete benefit and
offer setup now or a documented skip. Before changing project files, dependencies, global tools,
or external configuration, show the exact proposed change and obtain approval for that change.
After setup, verify the capability with the project's local/test environment. If the user skips or
verification fails, record `not configured` or `not verified`, the missing prerequisite and exact
next action; never imply QA coverage that is unavailable. Setup here does not authorize later
production access, destructive data operations, or remote publication.

Then write `specs/workflow-config.md` from the bundled template at `assets/workflow-config.md`
(resolve relative to this skill's directory), substituting the captured answers for the
angle-bracketed placeholders. Substitute each placeholder with one short list item: one command,
path, env name, status, or note per bullet. Repeat a bullet when there are several. Omit a bullet
that does not apply. Do not add paragraphs, section introductions, or blockquotes to the written
file. Put commands in backticks. Put `verified`, `not verified`, or `not configured` on that same
bullet, with a few words of reason only when it is not verified.

The template has no changelog section: **add a `## Changelog` section only when the user maintains
one**, as two bullets — `File:` path and `Format:`. If they don't, leave it out entirely — its
absence is what tells /finalize not to prompt for entries.

The `## Autopilot` section, by contrast, is in the template and is **always written** — recording
`report only` explicitly is better than leaving the mode implicit.

The `## Documentation lookup` section is also always written, including when Context7 setup
was skipped or could not be verified. Record status and next actions, not API keys or other
credentials.

For the operational sections, replace all placeholders with project-specific facts. Keep sections
only when applicable; omit unneeded bullets rather than filling them with guesses. Never commit
tokens, passwords, connection strings containing credentials, real test-account secrets, or
sensitive sample data. Record secret names and where they are supplied.

### Step 3: Summarize and point the way

Print a short status block showing what was created vs. already present:

```
specs/workflow-config.md    [created | completed | present]
specs/tasks/                [created | present]
```

Where `completed` means the artifact already existed and you filled in missing pieces. If you
referenced rules files in `workflow-config.md`'s Coding standards section, call that out so the user
knows to review them.
Summarize which local run, browser/API, data, and log capabilities were verified and which remain
unavailable with their next setup action.
Include Context7's observed availability, any configured-but-unavailable access, and its next
setup/reconnect action or documented skip.

Then close with two pointers, and stop — don't chain into another skill:

- **Review `workflow-config.md`'s Coding standards section.** It already points at your existing
  rules files; you only need to touch it if the references need adjusting.
- **Next step:** run `/start-task` **(copied to clipboard)** when you're ready to begin work. It
  reads `workflow-config.md` to fetch task details and propose a branch. Copy it to the clipboard
  first (best-effort: `Set-Clipboard`/`pbcopy`/`xclip`) — put the bolded **(copied to clipboard)**
  right after the command, only if the copy succeeded.

## Notes

- **Idempotent and gap-filling.** Re-running on a fully set-up project is safe: existing content is
  preserved, missing pieces (a blank config section, an absent file) are filled in, and content the
  user already wrote is only changed if they opt to. A partial setup gets completed, not reset.
- **Commit `specs/`.** It's living documentation; encourage the user to commit it so the workflow
  state is shared.
- **Honest configuration beats optimistic configuration.** Only record an integration as available
  after verifying it. Downstream skills trust this file.
