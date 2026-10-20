---
name: run-qa
description: Test a running application or software change as QA, after confirming the proposed scope with the user. Exercise relevant UI, API, CLI, or background behavior and write an evidence-backed report. Use for live verification, not for generating unexecuted test scenarios.
---

# /run-qa — Verify behavior in a running system

Test the current change as a user or external client would experience it. This is a standalone skill: it works without `specs/workflow-config.md` or task artifacts, does not edit application source, and does not replace `qa-scenarios` (which writes scenarios without executing them).

For workflow work-items, read [workflow integrity](../plan-task/references/workflow-integrity.md)
for required acceptance gates, source fingerprints, and stable review/QA history.
Standalone QA keeps its existing report format and needs no pipeline state.

## Resolve and confirm scope

1. Resolve an explicit PR, branch, work-item, feature, or application-wide target. Otherwise compare the current branch with its PR base or `main`/`master`, including staged, unstaged, and untracked changes. Read the diff, acceptance criteria when available, and enough adjacent behavior to identify meaningful regressions. If there is no resolvable target, ask for one.
2. **Before starting the application or running live checks**, show the user a short proposed scope: features and flows, relevant roles/configurations, test surfaces (UI, API, CLI, jobs, etc.), intended environment, and exclusions. Ask them to confirm or adjust it. Incorporate their answer; do not treat silence as confirmation. A user-provided scope is still restated for confirmation. Reading files and checking existing automated-test coverage before confirmation is fine.
3. Keep the confirmed scope in the report. If it changes materially during exploration, confirm the change before testing the added area. Prioritize the changed behavior and directly affected flows; do not imply full regression coverage from a scoped run.

## Prepare and exercise

1. If `specs/workflow-config.md` exists, read its applicable local operation, observable verification, and data/diagnostics sections first. Check the recorded commands, access, and tool availability in this session; then fill gaps from repo docs and the current environment. The config is a starting point, not proof that a tool still works. Prefer an isolated local or designated test environment and disposable data. Do not run state-changing checks against production or real user data without explicit authorization. Reuse a healthy environment; stop only services this run started.
2. Derive concrete cases from the confirmed scope and expected behavior. Label
   each required (acceptance criteria/DoD/required verification) or optional before
   running it. Do not downgrade a failed/unrun required case to finish. Use the
   most direct observable interface: real browser for UI, requests for APIs,
   commands for CLIs, and documented harness/outputs for jobs. Prefer a working
   runtime browser tool or configured fallback. Missing access means NOT EXERCISED,
   with required acceptance blocked and the exact prerequisite recorded.
3. For each case, record setup, action/input, expected result, observed result, and **PASS**, **FAIL**, or **NOT EXERCISED**. Verify actual state or response content, not just a successful command exit or HTTP status. Where the behavior persists data or starts a job, use a configured read-only query, admin view, or logs to check the saved result when it is safe and relevant. For UI cases capture screenshots at meaningful checkpoints, including failures; for other interfaces save sanitized request/response or command output and relevant logs. Check that evidence files exist and open representative screenshots to verify they show the claimed state.
4. Keep secrets and private data out of reports and images. Redact sensitive output before saving it; omit a screenshot if it cannot be made safe. Never invent evidence or call an unrun case a pass. A broken required case is a failure, while an unavailable environment is incomplete coverage.

## Report

Use stable case IDs so a retest can refer to the original case. The report must contain the confirmed scope, target revision or diff, environment and data, a short result summary, a case table with expected/observed results and evidence links, failures with reproduction steps, and untested cases with reasons. Use relative links to local evidence. A pass verdict requires every required case to pass; otherwise report **FAIL** or **INCOMPLETE** as appropriate. Distinguish a product failure from a test setup failure.

- **Standalone:** write `specs/qa/{slug}/report.md` and save evidence in `specs/qa/{slug}/evidence/{run-id}/`. Re-running appends a dated run section or updates the relevant cases while preserving earlier evidence; do not overwrite prior observations silently.
- **Workflow work-item:** update `## QA Verification` in the existing `review.md`;
  preserve all prior runs, case/finding IDs, decisions, evidence links and retest
  counts. Save evidence in `specs/qa/{task}/{work-item-or-task}/evidence/{run-id}/`.
  Record `**QA status:** complete | incomplete | skipped`, `**QA acceptance:** passed | blocked`,
  `**QA retest:** none | required`, and `**QA retests:** N` (initially zero).
  Each case includes required/optional classification, tested source fingerprint,
  actual result and evidence. `complete` means cases ran, not that they passed.
  Acceptance passes only when all required cases pass on current inputs or have
  specific demonstrated current automated equivalents; optional gaps are reported.
  Add genuine product failures to the Findings ledger using IDs above its current
  maximum, with Severity, Dimension: Acceptance Criteria, Location, Finding,
  Why it's valid, Suggested fix, and Status: open. Reuse/reopen an existing finding
  for the same failure. Use source file:line or name the interface and uncertainty.
  Apply the shared status-aware verdict table. Environment blockers stay in QA,
  where required unexercised cases block acceptance without inventing product bugs.

For a work-item retest, rerun failed cases and cases affected by source changes.
Append results/evidence, preserving history and reopening a fixed finding when
its behavior still fails. Increment the persistent `QA retests`. Clear `QA retest`
only when affected required cases were exercised on current inputs (or have a
demonstrated automated equivalent); otherwise leave `required`. Failed required
cases keep `QA acceptance: blocked` even after an executed retest. A limit or an
unavailable environment never clears an outstanding required retest.

Report the verdict, counts, finding IDs, evidence path, and outstanding checks in chat. Do not post to a PR, change labels, approve QA, or invoke another workflow stage. Preserve unrelated working-tree changes.
