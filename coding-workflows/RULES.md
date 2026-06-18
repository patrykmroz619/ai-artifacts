# Coding Workflows Rules

## Comments

Write no comments by default. Add one only when the *why* is non-obvious: a hidden constraint, a subtle invariant, a known external bug, or behavior that would surprise a reader. A comment that restates what well-named identifiers already say should be deleted.

## Scope

Implement exactly what the task requires — no more. Do not add error handling, fallbacks, or validation for scenarios that cannot happen. Do not introduce abstractions for hypothetical future requirements. Three similar lines is better than a premature abstraction.

## Change size

Prefer small, focused changes. One logical change per commit. If a change spans more than ~400 lines of diff, consider whether it can be split without losing context.

## Security

Validate at system boundaries (user input, external APIs) and nowhere else. Never construct shell commands by concatenating user input; use parameterized APIs. Do not log secrets, tokens, or PII.

## Dependencies

Prefer the language/runtime standard library before reaching for a package. When a package is necessary, choose one that is actively maintained, has a narrow scope, and does not introduce transitive vulnerabilities.
