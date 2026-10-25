---
name: structure-documentation
description: Design or refine a project's durable documentation structure with the user. Inspect the project and existing docs, research documentation practices where useful, and create or update specs/documentation-guide.md. Use before document-work or archive-task when the guide is missing or needs revision.
---

# /structure-documentation — Define how this project is documented

Create or update `specs/documentation-guide.md`, the project's source of truth for where durable documentation belongs and how it is maintained. This is a standalone documentation setup skill. It does not reorganize or write the project documents governed by the guide; those changes belong to a separately agreed documentation scope.

## Discover and discuss

1. Inspect the repository's purpose, components, existing documentation, `specs/workflow-config.md` when present, and task or PR history when useful. Identify current entry points, audiences, gaps, duplication, and conventions. Do not assume that a PRD per app, feature specs, or user stories are appropriate.
2. Ask the user focused, Socratic questions about who uses the docs, decisions they need to make, expected maintenance, and which existing conventions matter. Explain concrete options and tradeoffs from the project's evidence. Ask in rounds as needed; do not ask questions the repository answers.
3. Research external documentation practices only when they could settle a real structural choice. Prefer authoritative examples and record the relevant sources and why they apply. If a question concerns a library, framework, SDK, API, CLI, or cloud service, use Context7 as directed by repository guidance. Do not impose a generic template because it is common elsewhere.
4. Present a proposed documentation map and the intended changes to the guide for user confirmation. Include how existing docs are retained, moved, or retired, and any open tradeoff. Revise the proposal from feedback before writing.

## Write the guide

Create or update the existing `specs/documentation-guide.md` in place. Keep decisions already made unless the user revises them. The guide should be usable by `/document-work` without another architecture discussion:

- Purpose, intended readers, and what counts as durable project documentation rather than temporary workflow evidence.
- Locations and navigation for the document types this project actually needs; for each, say what belongs there and how to name or group it. Include existing authoritative docs instead of duplicating them.
- How to update a document when behavior changes, link related documents, and resolve stale or conflicting information. Identify the evidence that should ground claims, such as current code, accepted behavior, or a released feature.
- Any project-specific writing conventions, ownership or review expectations the user chose, and the boundary for documenting work not yet released.

Keep the guide concise and proportional to the project. Do not create empty document categories or example documents merely to fill the map. Check paths and links against the repository, summarize the decisions made, and point to the guide. Do not automatically invoke `/document-work` or `/archive-task`.
