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
- **Skip decision:** if existing automated checks demonstrably cover all changed behavior and no manual observation is needed, record `QA status: skipped`, `QA retest: none`, and the specific checks and rationale in `review.md`. Missing or merely listed tests are not proof of coverage. This is a completed stage, not an environment blocker.
- **Live run:** when manual observation adds value, execute the scoped cases using `run-qa`'s interface-specific guidance. For a retest, rerun only failed cases and cases affected by triage changes. Preserve earlier evidence. Record `QA status: complete` when all required cases ran, or `incomplete` when tools or environment prevented some. Record the actual result and open findings for product failures, even if the environment is also incomplete.
- **Retest limit:** perform at most two retest passes for one work-item. The `QA retests` count in `review.md` persists across resumed runs. After the limit, preserve any remaining failures or coverage gaps as outstanding; never mark them passed by inference. The triage stage will not request another automatic pass.
- **Unavailable environment:** write the reason and outstanding cases to `review.md`, set `QA status: incomplete` and `QA retest: none`, and return `STATUS: complete` with the limit in `OUTSTANDING`. Do not block autopilot solely because live QA could not run. The existing Blocker finding gate remains in force.
- **Handoff:** return the autonomy contract's stage report, with `STATUS-ADVANCED: none`. No clipboard, question, PR mutation, or next-stage invocation.

Do not add a decision-log entry for routine scope selection or an automated-only skip; the QA section itself explains these. Log a substantive ambiguity about expected behavior under the autonomy contract. Do not call a failed test or an unrun case a pass.
