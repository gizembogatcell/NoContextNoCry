---
name: commit-rule
description: Create a git commit that follows the repository Conventional Commit standards. Use when the user explicitly asks to commit with the project commit rule or invokes /commit-rule.
disable-model-invocation: true
---

# Commit Rule

## Purpose

Use this skill to create one clean git commit that follows `.cursor/rules/commit-standards.mdc`.

## Workflow

1. Read `.cursor/rules/commit-standards.mdc` before drafting the commit.
2. Inspect the working tree with `git status`.
3. Review staged and unstaged changes with `git diff` and `git diff --staged`.
4. Do not commit secrets, credentials, `.env` files, API keys, or generated noise.
5. Stage only files that belong to the requested logical change.
6. For meaningful code changes, run the fastest relevant verification available, usually `npm run lint` or targeted tests.
7. Commit with a Conventional Commit message:

```text
type(scope): short imperative summary
```

## Message Rules

- Use the repository types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, or `revert`.
- Keep the summary concise, lowercase after the type, and under 72 characters when possible.
- Use a scope when it clarifies the area, for example `feat(auth): add login guard`.
- Make one logical change per commit.
- Prefer intent over implementation detail.

## Safety

- Never run destructive git commands unless the user explicitly requests them.
- Never push unless the user explicitly requests it.
- If unrelated user changes are present, leave them unstaged and mention them.
- If there are no commit-worthy changes, do not create an empty commit.
