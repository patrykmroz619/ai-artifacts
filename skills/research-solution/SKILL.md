---
name: research-solution
description: Use when a programming problem, feature, or initiative's architecture or solution approach isn't already obvious and needs research before any planning starts — evaluating candidate libraries, frameworks, or services, or wanting to see how comparable open-source projects implemented a similar feature. Fits large initiatives spanning multiple future tasks as well as a single complex task, or whenever asked to research, investigate, or survey approaches, prior art, or comparable implementations.
---

# /research-solution — Research an architecture or solution approach

Research a complex or unfamiliar problem **through parallel subagents**, not by researching it yourself. You are the dispatcher and synthesizer: you scope the question, split it into independent research streams, dispatch one subagent per stream, then combine what comes back into a recommendation. You never do the web searching, library comparison, or source-code reading in your own context — that is what the subagents are for.

This skill is **standalone and outside the task pipeline**. It is not scoped to one task's `specs/tasks/{task}/` folder, because the problem it researches often outgrows a single task or even a single `/plan-task` run — a new architecture direction, a big feature, or a multi-task initiative. It reads no task artifacts and writes nothing into a task folder; run it any time, before a task even exists, and feed its output into whichever `/start-task` or `/plan-task` runs follow.

**Reads:** the problem statement from the user, and `specs/workflow-config.md`'s Coding standards section if present.
**Produces:** `specs/research/{slug}.md`.

**Why subagents, not you:** each research stream is an independent, open-ended investigation (searching, comparing, fetching real source). Running them yourself burns your context on raw search results and half-relevant README text you'll only need once. A subagent returns a distilled report; you keep only the synthesis.

## Documentation lookup

Include this guidance in applicable research-stream prompts: prefer Context7 when comparing
dependency API capabilities, integration setup, configuration, or version-sensitive behavior.
Establish the project's installed version from manifests/lockfiles, or the candidate version
being evaluated. Check actual session tool availability; workflow-config status, if present,
is only a starting point. Use `resolve-library-id` unless a suitable ID is already known,
then `query-docs` with a focused question. Reuse relevant results supplied in context; skip
lookups needing no external docs. If Context7 is unavailable, insufficient, or lacks
matching-version docs, consult official documentation and report material uncertainty rather
than blocking or installing tools. Return supporting links and version caveats for the
existing research report. Documentation complements the required source-code investigation;
it does not replace comparable-project discovery, source reading, or current evidence for
maintenance, licensing, and pricing.

## Process

### Step 1: Scope the research question

1. Get the problem statement from the user — a feature, an architecture question, or a broader initiative. Ask in one round if it's unclear; don't infer it from any task artifacts.
2. Pin down what's already decided (language, stack, hard constraints — license, scale, budget, must-integrate-with-X) so subagents don't re-litigate them.
3. Write a one-paragraph **research brief**: the problem, the fixed constraints, and the specific questions to answer (e.g. "CRDT vs OT for this use case", "which hosted service vs self-hosted", "how does a mature project structure the sync layer"). This brief is what every subagent prompt will carry — decide it before dispatching anything.

### Step 2: Plan independent research streams

Split the brief into 3–6 streams that can each be answered **without needing another stream's output**. Typical streams for an architecture/solution question:

| Stream | Subagent researches |
|---|---|
| Candidate libraries/frameworks | The library/framework landscape for this problem — options, maturity, maintenance status, license, tradeoffs |
| Candidate managed services | Hosted/managed alternatives that remove the need to build/operate the piece yourself |
| Comparable-project discovery | Search the web for open-source projects/apps that solved a similar problem — returns candidates, not deep analysis |
| Architecture pattern precedent | How this class of problem is typically structured, independent of any single library |

**Never pick the comparable OSS projects yourself from memory.** That's the same shortcut as researching the whole thing yourself — you're substituting your own training-data recall for actual research. The comparable-project discovery stream must search the web and come back with real candidates (repo URLs, why each is a plausible comparable, evidence of current relevance — stars/activity/recent commits) *before* any deep-dive subagent is dispatched on a named project.

This makes dispatch **two waves**, not one flat batch: Wave 1 is the streams above (including discovery); Wave 2 is one deep-dive subagent per project that Wave 1's discovery stream actually surfaced.

### Step 3: Dispatch Wave 1 — landscape and discovery, in parallel

Each subagent starts with **zero context** — it has not seen this conversation. Every prompt must be self-contained:

- The research brief from Step 1 (problem + constraints), verbatim or paraphrased — not "the thing we discussed."
- The one specific question this stream answers — narrow scope, not "research everything."
- The output contract: a structured report with named options/findings, evidence (URLs, repo names, recency signals), and an explicit tradeoff or recommendation — not a wall of prose.
- A length cap (e.g. "under 400 words") so the report stays a distillation, not a dump.
- For the discovery stream specifically: ask for 2–4 ranked candidates with repo URL, one-line reason each is comparable, and a recency/adoption signal (stars, last commit, how current its approach is) — this is a shortlist for Wave 2, not a full analysis of any of them.

Use `general-purpose` subagents (they need WebSearch/WebFetch). Launch every Wave 1 stream's Agent call **in the same message** — these streams don't depend on each other, so run them in parallel, not one at a time.

### Step 4: Dispatch Wave 2 — one deep-dive subagent per discovered project

From the discovery stream's shortlist, pick 2 candidates (favor architecturally different approaches over near-duplicates) and dispatch one subagent per project, again **in the same message** so they run in parallel. This wave depends on Wave 1's output — don't start it until discovery has returned.

Use **one subagent per comparable project**, not one subagent covering several projects shallowly — depth on one repo beats a paragraph each on three.

Each Wave 2 prompt must include:

- The research brief, the named project, and its repo URL (carried over from Wave 1's discovery findings — never a project you supplied from memory).
- **An explicit instruction to fetch and read real source, not summarize the README or marketing docs.** Name the concrete mechanism to find (e.g. "find the function that resolves concurrent edits and explain what it does, with file path and function name") — a vague "look at the source" gets a docs summary anyway.
- The same output contract and length cap as Wave 1: evidence as `file:line` / `repo/path/file`, an explicit fit judgment, capped length.

Use `general-purpose` subagents (they need Bash/Read for cloning and reading real source, plus WebFetch as a fallback).

Example Wave 2 subagent prompt:

```
We're evaluating architectures for [research brief: problem + constraints].
One candidate is [project name] ([repo URL]) — [why it's a plausible comparable].

Shallow-clone the repo (or fetch the relevant files directly) and read the ACTUAL
SOURCE that implements [specific mechanism, e.g. "how it resolves concurrent
edits without a central server"]. Do not summarize the README or docs site —
find the real function(s)/module(s), quote the key logic, and explain the
mechanism in your own words with exact file paths (and function names/line
ranges where useful).

Report back (under 400 words): the mechanism explained, the concrete evidence
(file:function), and one sentence on how well this fits our constraints.
```

### Step 5: Synthesize

Wait for both waves, then combine — don't just concatenate reports:

1. Cross-reference: where do library/service findings and OSS-project findings agree or disagree on the right mechanism?
2. Weigh each option against the fixed constraints from Step 1, not in the abstract.
3. Form one recommendation (or a short-list with a clear tiebreaker question) with explicit reasoning — a synthesis states a position, it doesn't just list what was found.
4. Note real risks/unknowns the research surfaced (e.g. a library's maintenance status, a service's pricing at scale) rather than only the upside.

### Step 6: Write the report

Write to `specs/research/{slug}.md` (create the directory if absent; slug from the problem statement):

```markdown
# Research: [Problem title]

## Problem & constraints

[The research brief from Step 1 — problem statement and fixed constraints.]

## Options considered

[Libraries/frameworks/services, each with maturity, license, and tradeoff notes.
Table if it aids comparison.]

## Comparable projects

[Per project investigated: name, repo, and the concrete mechanism found in its
source — with file/function evidence, not doc summaries.]

## Recommendation

[The synthesized position: what to use and why, weighed against the stated
constraints. Name real tradeoffs and open risks, not just the upside.]

## Open questions

[Anything the research didn't settle — worth a spike, a stakeholder call, or
revisiting once implementation starts.]
```

### Step 7: Self-review and hand off

Before presenting: check every option/recommendation traces to a subagent's evidence (no unsourced claims you introduced yourself), and that the recommendation actually answers the brief's questions rather than restating the options.

Summarize the report location and the one-line recommendation, then hand off. The next step depends on how big the researched problem turned out to be — a single task, or several:

> **Next step:** run `/start-task` (then `/plan-task`) to turn this into one task, or, for an initiative spanning multiple tasks, use `specs/research/{slug}.md` as shared context across each `/start-task` you run for it.

Stop there — don't start planning, implementing, or creating tasks yourself.

## Notes

- **You are the dispatcher, not a researcher.** If you catch yourself running a WebSearch or reading a cloned repo directly instead of delegating it to a subagent, stop — that piece of work belongs to a stream in Step 2/3.
- **Never name comparable projects from memory.** Picking "the well-known project for this" yourself is the same shortcut as researching it yourself — it substitutes recall for research, and recall goes stale. Discovery is always a web-search subagent's job; Wave 2 only ever targets what that subagent actually surfaced.
- **Depth over breadth on OSS projects.** One subagent per project, reading real source, beats one subagent skimming several projects' docs.
- **Self-contained prompts.** A subagent that gets "research libraries for this" with no constraints will re-derive assumptions you already settled. Always carry the brief.
- **Parallel dispatch, in two waves.** Wave 1 (landscape + discovery) is independent and goes in one message with multiple Agent calls. Wave 2 (per-project deep dives) depends on Wave 1's discovered candidates, so it waits for Wave 1 to return, then dispatches its own subagents together in one message. Only synthesize once both waves have returned.
- **Standalone, task-agnostic.** No task needs to exist yet, and the output isn't scoped to one. It reads and writes no task artifacts, and never edits source code.
