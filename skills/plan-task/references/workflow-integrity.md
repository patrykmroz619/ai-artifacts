# Workflow integrity

Read this for pipeline state transitions, verification, review/QA updates, or
finalization. It is shared by interactive and autonomous stages; autonomy changes
who makes a decision, not whether completion evidence is required.

## Phase and recovery

`task-plan.md` owns `pending → planned → implemented → reviewed → committed`.
For tasks with subtasks, retain the phase in each subtask heading. For a task
without subtasks, write `**Phase:** pending` below the task title and update it
through the same transitions. File existence never proves a phase completed.

Advance to `planned` after the implementation plan is written, `implemented`
after final source edits and required automated checks pass, and `reviewed` after
the review is written for that source snapshot. A reviewed phase means a review
exists, not that its findings or acceptance checks passed. Advance to `committed`
only using the finalization procedure below.

On legacy records without a phase, reconcile plan, verification evidence, review,
and git history before writing a phase. A plan alone supports at most `planned`;
a review without matching implementation evidence is drift. Read-only status
reports the ambiguity and recommends the owning stage; it never guesses or edits.
Autopilot stops with a recovery instruction if evidence cannot resolve the phase.

## Verification bound to source

Record an attempt ID, UTC time, actual commands, exit codes/results, environment,
required acceptance checks, tested HEAD, source fingerprint, and evidence paths
in `## Verification Log`. Keep prior attempts when superseding a result. Capture
the fingerprint before and after checks; different fingerprints invalidate the
attempt until changed inputs are understood and affected checks rerun. Record
manual checks separately as required/optional and PASS/FAIL/NOT EXERCISED.

Use the bundled `implement/scripts/verification-snapshot.mjs` when Node.js 22+
is available, resolved from the installed implement skill. Run it from the repo
root with `node <absolute-script-path>` for the working tree, and with `--index`
for the candidate commit. It prints a reproducible Git tree fingerprint, tested
HEAD, and excluded workflow-record paths, using a temporary index. It includes
tracked files and nonignored untracked files; secrets must remain ignored. It
excludes only the workflow record/evidence directories listed in its output.
Never exclude application, test, dependency, build, or runtime configuration inputs.
For a relevant ignored/generated input, also record its digest or reproducible
generation command. Submodule tree entries cover the submodule commit only;
record dirty submodule input digests separately or verify a clean candidate.
Record environment/dependency changes that invalidate results.

If Node is unavailable, use an equivalent project-supported snapshot method and
record its algorithm, inputs, exclusions, and digest. Do not install tools solely
to obtain a fingerprint or substitute a date/HEAD alone for dirty-tree evidence.

After any source edit, including self-review, triage, or an amend, invalidate
affected automated results, review coverage, and QA cases. An agent must inspect
the delta to justify reusing unaffected evidence. Missing or mismatched evidence
requires the necessary checks; blanket prohibitions on rerunning do not apply.
Record both the old and new fingerprints and the reuse rationale. Metadata-only
phase/report edits do not invalidate source checks. Changes to requirements or
the verification plan still require reassessing coverage even if source is equal.

Before committing, compare the tested snapshot with the candidate index snapshot.
If they differ, inspect the delta. Unrelated work present during testing but absent
from the candidate can mask failures: verify the isolated candidate in a temporary
worktree or equivalent test environment before claiming it passes. Do not alter
the user's original working tree to make the fingerprints match. Reuse evidence
only for a demonstrably equivalent set of verification inputs.

## Finding gates and verdicts

Use this table everywhere: review headers, triage, status, routing, and finalize.

| Finding state | Interactive gate | Autonomous gate |
| --- | --- | --- |
| Blocker `open` or `deferred` | Rejected; resolve or explicitly accept risk | Blocked |
| Blocker `skipped` | Invalid resolution; require explicit risk acceptance | Blocked |
| Blocker `accepted` or `dismissed` | Clears only with the user's recorded reason | Blocked; no autonomous risk acceptance/dismissal |
| Blocker `fixed` or `stale` | Clears with verified fix or evidence it no longer applies | Same |
| Major `open` or `deferred` | Needs attention; report outstanding | Same; not a commit gate |
| Minor `open` or `deferred` | Report outstanding; not a commit gate | Same |
| Other resolved findings | Retain resolution and evidence | Same, subject to mode restrictions |

No remaining Blocker/Major above means Approved. An unknown severity/status, missing
review, or unsupported resolution is inconsistent evidence, not implicit approval.
`fixed` requires the relevant checks to pass; applying an edit alone is insufficient.
Interactive users may explicitly override a commit gate only after the exact
remaining risk is shown and their decision/reason is recorded. An override does
not turn failed/unrun checks into passes. Autonomous stages cannot override gates.

## Required QA and stable history

Classify cases as required (acceptance criteria, DoD, or required verification) or
optional before execution. Do not downgrade an unrun/failed required case to optional
to finish. Each case records its tested fingerprint, expectation, observation,
PASS/FAIL/NOT EXERCISED, and evidence. Current required cases must pass, or have a
specific demonstrated automated equivalent, before autonomous finalization.
`QA status: complete` describes execution coverage, not a passing verdict.
Use `QA acceptance: passed | blocked` independently of coverage status.

Missing tools/environment or exhausted retests leave required acceptance blocked;
stop with a resumable report. Optional gaps may remain outstanding. A skipped QA
stage needs named, current automated checks covering every required case. A failed
required case remains blocked even if its finding was deferred. On source changes,
mark affected required cases `QA retest: required`; a retest limit never clears
that marker. Invalidate optional-only affected cases and report them as optional
gaps; they do not block required acceptance.

Re-review updates `review.md` in place: append a dated review pass with its source
fingerprint; preserve all finding IDs, decisions, prior observations, QA sections,
evidence links, and persistent retest count. Allocate new IDs above the highest
existing ID. Reopen a resolved finding if the same problem recurs, appending why.
Mark a finding stale only with evidence, retaining its history. Absence from a new
review is not resolution. Recompute the header from the complete current ledger.

## Scope-safe, recoverable finalization

1. Before implementation, record HEAD/branch and pre-existing staged, unstaged,
   and untracked work, including overlapping files. If a run predates that record,
   reconstruct ownership from diffs/history; block if safe separation is impossible.
2. Preserve the real index and working tree. Build a task-only candidate with hunk
   selection or a temporary index initialized from HEAD. Do not use whole-file
   staging for mixed files, `git add .`, or a commit that consumes unrelated staged
   work. Do not reset/stash/discard user changes. Account for new/deleted files and
   stage only the task's workflow records, linked evidence, and configured changelog.
3. Inspect the candidate's full diff against HEAD, verify task ownership and required
   checks/gates for that candidate, and record a `## Finalization` entry in
   `task-plan.md`: `State: prepared`, scope, branch, expected parent HEAD, exact
   subject, candidate source fingerprint, and paths. Keep the phase `reviewed`.
   Keep a separate entry per work-item/attempt, preserving earlier finalizations.
   This prepared record belongs in the task commit; exclude workflow metadata from
   the source fingerprint to avoid self-reference.
4. Commit that candidate. After success, set the covered phase(s) to `committed`
   and finalization state to `committed`, retaining parent/subject/fingerprint.
   Include the final record by amending only this run's unpublished commit with
   its unchanged subject and task-only index. Never include a commit's own hash
   inside itself. Verify both the commit tree and saved phase before publication.
   Preserve unrelated staged/unstaged content in the real index after each operation;
   reconcile its entries against the new HEAD without losing original user hunks.
5. If commit/amend fails or execution is interrupted, report the actual state and
   stop before push/PR/tracker actions. On resume inspect history for the prepared
   parent, subject, scope, and source fingerprint. A matching commit means finish
   saving the ledger, not create another code commit. If HEAD moved or the commit
   was published, do not amend it; repair the ledger in a separate scoped metadata
   commit after verifying history. Ambiguous ownership stops for recovery.
6. An already committed scope resumes only outstanding completion actions under
   current authorization. Never repeat implementation or create duplicate commits.

The task is locally complete only when code and its committed ledger agree. Report
incomplete verification and unfinished remote actions separately from local commits.
