# Workflow Configuration

Single source of truth for how this project's dev-workflow skills run and verify the app
and integrate with external systems. Record commands that work in a local or disposable
test environment; never store secrets here.
Update by re-running /init-workflow or by editing this file directly.

## Project map

- **Apps and services:** <purpose of each relevant app/service and its source entry point>
- **Code and docs:** <key source areas and authoritative architecture/setup docs>

## Local operation

- **Environment and prerequisites:** <local services, required tools, and safe data boundary>
- **Setup:** <working directory and exact setup command; source file or doc>
- **Start:** <working directory, exact command, URL/port or other entry point>
- **Ready when:** <health check or observable condition>
- **Stop/cleanup:** <how to stop services started by the agent and reset disposable data>
- **Environment variables:** <names and where to supply them; no values or secrets>
- **Availability:** <verified | not verified, reason | not configured, next action>

## Automated verification

- **Checks:** <each applicable test, lint, typecheck, or build command with its prerequisite and verified/not verified status>
- **Results:** <where output/reports appear; source file or doc>
- **Missing setup:** <unavailable checks and exact next action; omit when all relevant checks work>

## Observable verification

- **Interfaces and tools:** <each applicable UI browser tool and portable fallback, API request command/base URL, CLI or job entry point, with verified/not verified status>
- **Test users and fixtures:** <safe roles, account provisioning, and seed/reset commands; no passwords>
- **Missing setup:** <unavailable interfaces and exact next action; omit when all relevant interfaces work>

## Data and diagnostics

- **Persisted data:** <local/test data source and read-only client, admin endpoint, or sample query; verification status>
- **Logs and jobs:** <exact log locations or commands and job failure inspection, as applicable; verification status>
- **Missing setup:** <unavailable diagnostics and exact next action; omit when all relevant diagnostics work>

## Documentation lookup

> Optional Context7 access for dependency APIs, setup, configuration, and version-sensitive
> behavior. Recheck actual session tools before use; this record does not guarantee access.
> If unavailable or insufficient, use official documentation and continue.

- **Context7 availability:** <verified | not verified, reason | not configured, confirmed missing setup>
- **Client/access mechanism:** <agent client and Context7 MCP connection; configuration scope/location if known, never credentials>
- **Verification:** <successful library/topic lookup and relevant version or coverage caveat; otherwise what prevented verification>
- **Next action:** <missing prerequisite, setup/reconnect step, or documented user skip with official setup link; omit when none>

## Task management

- **System:** <Jira | Linear | GitHub Issues | any other tracker | none>
- **Access mechanism:** <MCP server | CLI (e.g. `gh`) | REST API | manual>
- **Availability:** <verified available | configure before use | manual only>
- **Notes:** <project/board key, repo slug, URL, auth method and secret names, setup details — never token or password values>

## Git conventions

- **Branch naming:** <e.g. feat/{ticket}-{slug}, or "ask each time">
- **Commit style:** <e.g. Conventional Commits>

## Autopilot

> How an unattended `/autopilot` run or either `/small-task` shortcut is allowed to finish. It commits locally either way;
> this decides whether it may also push and open a PR/MR. Absent section = report only.

- **Completion mode:** <open PR/MR | report only>
- **Remote host:** <GitHub (`gh`) | GitLab (`glab`) | other | n/a>
- **Notes:** <base branch, draft or ready, reviewers/labels — anything an unattended run needs to open the PR/MR correctly>

## Coding standards

> Existing rules files in this repo that already define coding standards. Treat these as
> authoritative — follow them when planning, implementing, and reviewing.

- `<path/to/rules-file>` — <one line on what standards it covers>
