---
name: auto-run-qa
description: Autonomous live QA stage for /autopilot. After implementation review, decide whether a work-item needs observable testing, run scoped UI/API/CLI or other checks when it does, and record evidence and findings in review.md before triage. Not intended for interactive use; use /run-qa instead.
---

# /auto-run-qa — Autonomous QA verification

**Derived from:** `../run-qa/SKILL.md` — follow its test and reporting contract, with the overrides below.
**Autonomy contract:** `../autopilot/assets/autonomy-contract.md` — read it too.

The coordinator supplies the task and work-item. This stage runs after `auto-review-implementation` has written `review.md`, before `auto-triage-findings`, and again after triage when `QA retest: required` is recorded. It does not change `task-plan.md` status or application source.

## Overrides

- **Scope confirmation:** there is no user to confirm it. Derive the smallest meaningful scope from the work-item's acceptance criteria, diff, and existing automated verification. Write that scope to `## QA Verification` **before** exercising it. Do not expand into unrelated flows.
- **Skip decision:** only current, fingerprinted automated evidence demonstrably
  covering every required case permits `QA status: skipped`, `QA acceptance: passed`,
  and `QA retest: none`. Name the checks and acceptance mapping in `review.md`.
  Missing/listed/stale tests are not coverage, nor does skipping waive required checks.
- **Live run:** when manual observation adds value, execute the scoped cases using `run-qa`'s interface-specific guidance. For a retest, rerun only failed cases and cases affected by triage changes. Preserve earlier evidence. Record `QA status: complete` when all required cases ran, or `incomplete` when tools or environment prevented some. Record the actual result and open findings for product failures, even if the environment is also incomplete.
- **Retest limit:** at most two retest passes per work-item, persisting the count
  across re-review and resume. Exhaustion preserves affected cases and any required
  retest marker. Return `STATUS: blocked` when required acceptance remains unverified
  or failed after the limit; report optional gaps without claiming a pass for them.
- **Unavailable environment:** preserve evidence and record the reason and exact
  prerequisite. Set `QA status: incomplete`; required unexercised cases mean
  `QA acceptance: blocked` and `STATUS: blocked`. Optional-only gaps may return
  `complete` with acceptance passed and an honest OUTSTANDING report. Never clear
  a required retest just because the environment could not exercise it.
- **Handoff:** return the autonomy contract's stage report, with `STATUS-ADVANCED: none`. No clipboard, question, PR mutation, or next-stage invocation.

Do not add a decision-log entry for routine scope selection or an automated-only skip; the QA section itself explains these. Log a substantive ambiguity about expected behavior under the autonomy contract. Do not call a failed test or an unrun case a pass.
