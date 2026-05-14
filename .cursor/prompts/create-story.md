---
description: Create a user story file in docs/stories/. Use when the analyst or SM needs to document a feature as an implementable story with acceptance criteria and tasks.
---

Create a user story for a feature and save it to `docs/stories/`.

## Instructions

Ask the user for the following, one at a time:

1. **Story title** — short kebab-case name (e.g., `user-login`, `product-search`)
2. **Story number** — next sequential number (check `docs/stories/` for existing files)
3. **Role** — who is the user? (e.g., "registered user", "admin", "guest")
4. **Action** — what do they want to do?
5. **Benefit** — why? what value does this provide?
6. **Acceptance Criteria** — ask for a numbered list; add at least 3 ACs
7. **Priority** — Must / Should / Could / Won't (MoSCoW)
8. **Any technical constraints or dependencies** to note in Dev Notes

Then generate the story file at `docs/stories/{n}.{title}.story.md`:

```markdown
# Story {n}: {Title}

**Status**: Draft
**Priority**: {Must/Should/Could/Won't}
**Epic**: {epic name if applicable}

---

## Story

**As a** {role},
**I want** {action},
**so that** {benefit}

---

## Acceptance Criteria

1. {AC 1}
2. {AC 2}
3. {AC 3}

---

## Tasks / Subtasks

- [ ] Task 1 (AC: 1)
  - [ ] Subtask 1.1
- [ ] Task 2 (AC: 2)
  - [ ] Subtask 2.1
- [ ] Task 3 (AC: 3)
  - [ ] Subtask 3.1

---

## Dev Notes

{Technical context: relevant architecture decisions, file locations, patterns to follow, dependencies.
Pull ONLY from docs/architecture.md — do not invent details.}

---

## File List

> Dev subagent fills this in during implementation

---

## Change Log

| Date    | Version | Description            | Author  |
| ------- | ------- | ---------------------- | ------- |
| {today} | 1.0     | Initial story creation | analyst |
```

After generating, confirm the file path with the user and ask if they want to change the status from `Draft` to `Approved`.
