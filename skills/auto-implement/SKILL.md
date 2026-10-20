---
name: auto-implement
description: Autonomous counterpart to /implement, for unattended /autopilot runs. Carries out a work-item's implementation-plan.md in code and runs its automated checks to green, deciding and logging instead of pausing on blockers, and reporting manual verification as outstanding instead of waiting for the user to accept. Dispatched by /autopilot; not meant to be run by hand (use /implement when a human is present).
---

# /auto-implement — Carry out the plan in code (autonomous)

**Derived from:** `../implement/SKILL.md` — read it in full and follow it
exactly, **except** where the Overrides table below replaces a step.
**Autonomy contract:** `../autopilot/assets/autonomy-contract.md` — read it too.

You have no user. `AskUserQuestion` is unavailable, and there is no one to
perform the manual checks or sign off on the result. The core skill's blocker
pause and its acceptance loop are what this skill replaces — the execution
discipline is unchanged.

## Overrides

| Core step | Autonomous replacement |
| --- | --- |
| **Step 1.2** — ask when the scope is ambiguous | The dispatching prompt passes the scope explicitly. Use it. |
| **Step 1.4** — ask whether to redo an already-`implemented` subtask | Don't redo it. Report `STATUS: complete` with `STATUS-ADVANCED: none` and say it was already implemented; the coordinator routes onward. An **amend** dispatch is the exception — it names what to change and you carry it out. |
| **Step 3** — pause and `AskUserQuestion` on a genuine blocker | Decide and continue: take the reading most consistent with the plan's Contracts and the surrounding code, and log it at `Low` confidence naming the contradiction. Reserve `STATUS: blocked` for the genuinely impossible (see *When to block* below). |
| **Step 8** — hand the manual verification to the user and ask for feedback | **Verify what you can, report what you can't.** See *Manual verification* below. No question, no plain-message request. |
| **Step 9** — iterate until the user explicitly accepts | There is no acceptance loop and no one to accept. Once the automated checks are green and Step 7's self-review passes, the stage is done. |
| **Step 10** — next-step line + clipboard copy | Return the stage report block from the autonomy contract instead. No `> **Next step:**` line, no clipboard, no invoking `/auto-review-implementation`. |

Everything else stands, and the parts that stand are the ones that matter:
follow the ordered steps, honor the Contracts exactly, match the surrounding
idiom, **build against current code rather than the plan's snapshot**, run the
automated checks until green, record material deviations in
`## Implementation Notes`, advance status, and self-review before reporting.

## Manual verification

The plan's **Verification → Manual** items don't disappear because nobody's
here to do them. For each one:

1. **Verify it programmatically when that's honestly possible** — hit the
   endpoint, run the script, assert the file changed, read back the record. Say
   in the report what you actually checked.
2. **Otherwise report it verbatim under `OUTSTANDING`** in the stage report. It
   reaches the human in `/autopilot`'s final summary, which is the point.

**Never mark a manual check done because the code looks like it should work.**
Reading the implementation you just wrote is not verification of it. A check you
couldn't run is outstanding, and saying so is the honest outcome.

## When to block

`STATUS: blocked` stops the entire run, so the bar is genuine impossibility, not
difficulty:

**Block on:** a credential or environment the work needs and cannot obtain; a
dependency that can't be installed or reached; a precondition the pipeline should
have produced and didn't (no `implementation-plan.md` at the resolved location);
a plan whose steps contradict the codebase so fundamentally that any reading
would be invention rather than interpretation.

**Don't block on:** an ambiguous step, two viable approaches, a plan that's
thinner than you'd like, a pre-existing test failure unrelated to your change, or
a step that turned out harder than planned. Those are decisions — make them, log
them, keep going.

A red check you introduced is never a reason to block either. Fix it, per the
core skill's Step 4. If something is still failing at the end, report it with the
actual output and say why, exactly as the core skill requires — **never silently
skip a red check**, and never advance status on the strength of a check you
didn't actually run.

## Notes

- **Green checks are the only gate left.** With the user's acceptance gone, the
  implementation phase requires current passing automated verification; required
  manual/QA acceptance remains a separate finalization gate. Run checks for real,
  bind results to source fingerprints, rerun affected checks after self-review
  fixes, and advance the no-subtasks Phase just like subtask headings.
- **Deviations must be recorded.** `## Implementation Notes` is the highest-yield
  input to the review that follows, and the reviewer is a fresh agent that saw
  none of your reasoning. An unrecorded deviation is invisible for the rest of
  the run.
- **Doing, not planning.** A decision that genuinely reopens the plan's approach
  is a `Low`-confidence log entry, not a quiet re-plan. The coordinator's sanity
  check exists for exactly that case.
- **Scope discipline.** Implement this work-item. Nothing lands outside its
  Target Structure — no opportunistic refactors, no fixing things nobody asked
  about.
