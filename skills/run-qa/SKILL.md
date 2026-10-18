---
name: run-qa
description: Test a running application or software change as QA, after confirming the proposed scope with the user. Exercise relevant UI, API, CLI, or background behavior and write an evidence-backed report. Use for live verification, not for generating unexecuted test scenarios.
---

# /run-qa — Verify behavior in a running system

Test the current change as a user or external client would experience it. This is a standalone skill: it works without `specs/workflow-config.md` or task artifacts, does not edit application source, and does not replace `qa-scenarios` (which writes scenarios without executing them).

## Resolve and confirm scope

1. Resolve an explicit PR, branch, work-item, feature, or application-wide target. Otherwise compare the current branch with its PR base or `main`/`master`, including staged, unstaged, and untracked changes. Read the diff, acceptance criteria when available, and enough adjacent behavior to identify meaningful regressions. If there is no resolvable target, ask for one.
2. **Before starting the application or running live checks**, show the user a short proposed scope: features and flows, relevant roles/configurations, test surfaces (UI, API, CLI, jobs, etc.), intended environment, and exclusions. Ask them to confirm or adjust it. Incorporate their answer; do not treat silence as confirmation. A user-provided scope is still restated for confirmation. Reading files and checking existing automated-test coverage before confirmation is fine.
3. Keep the confirmed scope in the report. If it changes materially during exploration, confirm the change before testing the added area. Prioritize the changed behavior and directly affected flows; do not imply full regression coverage from a scoped run.

## Prepare and exercise

1. If `specs/workflow-config.md` exists, read its applicable local operation, observable verification, and data/diagnostics sections first. Check the recorded commands, access, and tool availability in this session; then fill gaps from repo docs and the current environment. The config is a starting point, not proof that a tool still works. Prefer an isolated local or designated test environment and disposable data. Do not run state-changing checks against production or real user data without explicit authorization. Reuse a healthy environment; stop only services this run started.
2. Derive concrete cases from the confirmed scope and expected behavior. Use the most direct observable interface: a real browser for UI, requests for APIs, commands for CLIs, and the project's documented harness or observable outputs for background work. Prefer a working dedicated browser tool in this agent runtime; otherwise use the configured portable fallback or discover a suitable tool. If a required tool, credential, or environment is unavailable, mark its cases **not exercised** and record the blocker.
3. For each case, record setup, action/input, expected result, observed result, and **PASS**, **FAIL**, or **NOT EXERCISED**. Verify actual state or response content, not just a successful command exit or HTTP status. Where the behavior persists data or starts a job, use a configured read-only query, admin view, or logs to check the saved result when it is safe and relevant. For UI cases capture screenshots at meaningful checkpoints, including failures; for other interfaces save sanitized request/response or command output and relevant logs. Check that evidence files exist and open representative screenshots to verify they show the claimed state.
4. Keep secrets and private data out of reports and images. Redact sensitive output before saving it; omit a screenshot if it cannot be made safe. Never invent evidence or call an unrun case a pass. A broken required case is a failure, while an unavailable environment is incomplete coverage.

## Report

Use stable case IDs so a retest can refer to the original case. The report must contain the confirmed scope, target revision or diff, environment and data, a short result summary, a case table with expected/observed results and evidence links, failures with reproduction steps, and untested cases with reasons. Use relative links to local evidence. A pass verdict requires every required case to pass; otherwise report **FAIL** or **INCOMPLETE** as appropriate. Distinguish a product failure from a test setup failure.

- **Standalone:** write `specs/qa/{slug}/report.md` and save evidence in `specs/qa/{slug}/evidence/{run-id}/`. Re-running appends a dated run section or updates the relevant cases while preserving earlier evidence; do not overwrite prior observations silently.
- **Workflow work-item:** append or update `## QA Verification` in that work-item's existing `review.md` and save evidence in `specs/qa/{task}/{work-item-or-task}/evidence/{run-id}/`. Include `**QA status:** complete | incomplete | skipped`, `**QA retest:** none | required`, and `**QA retests:** N` (starting at zero) in the section. The section owns the scope, case results, evidence links, and coverage limits. Add genuine product failures to the existing `## Findings` ledger as new `F` IDs with `Severity`, `Dimension: Acceptance Criteria`, `Location`, `Finding`, `Why it's valid`, `Suggested fix`, and `Status: open`; use a source `file:line` when the cause can be located, otherwise name the route or interface and make the location uncertainty explicit. Recompute the review header verdict and counts under its existing thresholds. Environment blockers belong in QA Verification, not as product findings.

For a work-item retest, rerun failed cases and any cases affected by triage changes. Update their latest result and link new evidence without deleting the earlier run. Reopen a fixed finding if its same behavior still fails; use a new finding ID for a distinct failure. Increment `QA retests`, set `QA retest: none` when the required retest has been attempted, even if it remains incomplete, and report the limit.

Report the verdict, counts, finding IDs, evidence path, and outstanding checks in chat. Do not post to a PR, change labels, approve QA, or invoke another workflow stage. Preserve unrelated working-tree changes.
