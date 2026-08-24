# Workflow Configuration

Single source of truth for how this project's dev-workflow skills integrate with external systems.
Update by re-running /init-workflow or by editing this file directly.

## Task management

- **System:** <Jira | Linear | GitHub Issues | any other tracker | none>
- **Access mechanism:** <MCP server | CLI (e.g. `gh`) | REST API | manual>
- **Availability:** <verified available | configure before use | manual only>
- **Notes:** <project/board key, repo slug, URL, auth/setup details — anything skills need to address the tracker>

## Git conventions

- **Branch naming:** <e.g. feat/{ticket}-{slug}, or "ask each time">
- **Commit style:** <e.g. Conventional Commits>

## Autopilot

> How an unattended `/autopilot` run is allowed to finish. It commits locally either way;
> this decides whether it may also push and open a PR/MR. Absent section = report only.

- **Completion mode:** <open PR/MR | report only>
- **Remote host:** <GitHub (`gh`) | GitLab (`glab`) | other | n/a>
- **Notes:** <base branch, draft or ready, reviewers/labels — anything an unattended run needs to open the PR/MR correctly>

## Coding standards

> Existing rules files in this repo that already define coding standards. Treat these as
> authoritative — follow them when planning, implementing, and reviewing.

- `<path/to/rules-file>` — <one line on what standards it covers>
