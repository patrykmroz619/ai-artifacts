---
name: commit-message
description: Write a clear, conventional commit message for staged changes
---

# Commit Message

Write a Conventional Commits message for the staged diff.

## Steps

1. Run `git diff --cached` to see all staged changes.
2. Identify the primary change type:
   - `feat` — new user-visible behavior
   - `fix` — bug fix
   - `refactor` — restructuring without behavior change
   - `chore` — tooling, deps, config, docs
   - `test` — adding or fixing tests
   - `perf` — performance improvement
3. Derive a concise scope (the module, package, or area changed) if one applies.
4. Write a subject line: `<type>(<scope>): <imperative summary>` — ≤72 chars, no period.
5. If the *why* is non-obvious, add a short body paragraph (wrap at 72).
6. Add a `Refs:` line for any issue/ticket references found in the conversation context.
7. Present the message. On approval, run:
   ```bash
   git commit -m "$(cat <<'EOF'
   <your message here>
   EOF
   )"
   ```

## Rules

- Subject line is imperative ("add", "fix", "remove" — not "added" or "fixes").
- Do not pad with filler phrases ("this commit", "in order to").
- Body explains *why*, not *what* — the diff already shows what changed.
- Never pass `--no-verify` unless explicitly asked.
