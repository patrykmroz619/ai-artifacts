---
name: conversation-audit
description: Audit the current AI agent conversation for evidenced workflow friction and recommend changes to project setup, tools, or app interfaces. Use when asked to review a session or make future agent work easier; report only.
---

# Conversation audit

Review how the agent worked in the current conversation and identify practical improvements for future work. This skill is standalone and read-only. Report recommendations in chat; do not edit files, install tools, change permissions, or apply fixes as part of the audit.

## Evidence to inspect

1. Use the conversation and tool results actually available in the current session. If the user supplies an export or trace, include it. Do not assume that a compacted context, summary, or host UI exposes the full session. Do not search unrelated conversations or private host log stores by default.
2. Reconstruct relevant task attempts and outcomes. Look for failed or repeated commands, missing dependencies or commands, access and permission denials, unavailable tools, repeated discovery of how to run or test the project, unclear or conflicting instructions, and work that could not be verified through tests, logs, fixtures, or app interfaces.
3. For promising findings, inspect relevant project files and configuration with targeted, read-only commands when available. Check existing scripts, agent instructions, documentation, test setup, diagnostics, and tool configuration before claiming something is missing. Use host documentation only when a host-specific capability or setting matters to a recommendation.
4. Distinguish a recurring or costly obstacle from normal exploration, a one-off command mistake, a temporary external failure, an expected security boundary, or an issue already fixed during the conversation. A denied action alone is not a reason to weaken permissions; consider a narrower command, safer workflow, or better diagnostic path first.

## Recommendations

Suggest the smallest durable change supported by evidence: a documented or reusable command, clearer agent instructions, a suitable tool integration, a deterministic check or fixture, more accessible logs or error output, or an app change that makes a task observable and testable. Include app changes only when the session shows a concrete obstacle they would address. Do not recommend new tools, broad permission grants, or process rules merely because they might be useful.

Prioritize up to five findings by impact on task completion, recurrence, and effort to fix. For each finding, provide:

- **Evidence:** the specific attempt, result, or repeated pattern; cite conversation steps or file paths when available.
- **Cause and confidence:** what likely caused the friction, separating observation from inference.
- **Change:** a concrete recommendation and where it belongs.
- **Benefit and verification:** what would improve and how a later session could confirm it.

Start the report with the evidence scope, including any missing history or unavailable project access. Group duplicate symptoms under one cause. If evidence does not support an actionable recommendation, say so plainly. Do not claim to have run checks, read logs, or reviewed conversation portions that were unavailable.
