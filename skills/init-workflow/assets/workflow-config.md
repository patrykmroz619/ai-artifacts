# Workflow configuration

## Project map

- `<app>` — `<purpose>` — `<entry path>`
- Docs: `<path>`

## Local operation

- Prereqs: `<tool or service>`
- Setup: `<cwd>` — `<command>` — `<source>`
- Start: `<cwd>` — `<command>` — `<url or entry>`
- Ready: `<command or condition>`
- Stop: `<command>`
- Env: `<NAME>` from `<source>`
- Status: `verified` | `not verified` — `<reason>` | `not configured` — `<next action>`

## Automated verification

- `<command>` — `<what>` — `<prereq or none>` — `verified` | `not verified` — `<reason>`
- Results: `<path>`
- Missing: `<next action>`

## Observable verification

- UI: `<tool>` — fallback `<command>` — `verified` | `not verified`
- API: `<command>` — `<base url>`
- CLI: `<command>`
- Job: `<trigger>` — `<observable output>`
- Fixture: `<role>` — `<seed or reset command>`
- Missing: `<next action>`

## Data and diagnostics

- Data: `<source>` — `<read-only command or endpoint>` — `verified` | `not verified`
- Logs: `<path or command>`
- Jobs: `<failure command>`
- Missing: `<next action>`

## Documentation lookup

- Context7: `verified` | `not verified` — `<reason>` | `not configured`
- Client: `<client>` — `<config path>`
- Check: `<library>` — `<version or caveat>`
- Next: `<action, or skip plus setup link>`

## Task management

- System: `<tracker | none>`
- Access: `MCP` | `CLI` | `REST` | `manual`
- Status: `verified` | `configure before use` | `manual only`
- `<key>`: `<value>`

## Git conventions

- Branch: `<pattern>`
- Commits: `<style>`

## Autopilot

- Mode: `open PR/MR` | `report only`
- Host: `GitHub (gh)` | `GitLab (glab)` | `other` | `n/a`
- Base: `<branch>`
- PR: `draft` | `ready`
- Reviewers: `<names or none>`
- Labels: `<labels or none>`

## Coding standards

- `<path>` — `<one line>`
