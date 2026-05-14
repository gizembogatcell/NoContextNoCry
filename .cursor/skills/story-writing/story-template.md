# Story Template

Use this template when generating story files in `docs/stories/`.
File name: `docs/stories/{n}.{kebab-title}.story.md`

---

```markdown
# Story {n}: {Title}

**Status**: Draft
**Priority**: Must / Should / Could / Won't
**Epic**: {epic name or "none"}
**Created**: {date}

---

## Story

**As a** {specific role},
**I want** {concrete action},
**so that** {real user value / benefit}

---

## Acceptance Criteria

1. {Given [context], when [action], then [outcome]}
2. {Given [context], when [action], then [outcome]}
3. {Error/edge case: given [context], when [action], then [outcome]}

---

## Tasks / Subtasks

- [ ] Task 1: {description} (AC: 1)
  - [ ] Subtask 1.1: {specific step}
  - [ ] Subtask 1.2: {specific step}
  - [ ] Subtask 1.3: Write tests for Task 1
- [ ] Task 2: {description} (AC: 2)
  - [ ] Subtask 2.1: {specific step}
  - [ ] Subtask 2.2: {specific step}
  - [ ] Subtask 2.3: Write tests for Task 2
- [ ] Task 3: {description} (AC: 3)
  - [ ] Subtask 3.1: {specific step}
  - [ ] Subtask 3.2: Write tests for Task 3

---

## Dev Notes

> Pulled from `docs/architecture.md` only. Do not invent details.

**Relevant files:**

- `{path/to/component.tsx}` — {what it is}
- `{path/to/api/route.ts}` — {what it is}

**Patterns to follow:**

- {e.g. Use the same fetch pattern as in Story N}
- {e.g. Component must use the design system Button from src/components/ui/}

**API / Data:**

- Endpoint: `{METHOD} {path}` — {description}
- Model: `{EntityName}.{field}` — {description}

**Environment variables needed:**

- `{VAR_NAME}` — {what it's for}

---

## File List

> Dev subagent fills this in during implementation.

---

## Change Log

| Date   | Version | Description   | Author  |
| ------ | ------- | ------------- | ------- |
| {date} | 1.0     | Initial story | analyst |
```
