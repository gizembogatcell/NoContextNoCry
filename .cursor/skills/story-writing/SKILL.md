---
name: story-writing
description: "Use when: creating a user story, breaking a feature into tasks, writing acceptance criteria, or producing a story file in docs/stories/. Produces a complete, implementation-ready story."
---

# Skill: Story Writing

## Purpose

Produce an implementation-ready user story that contains all the context a dev subagent needs to implement the feature without reading any other document.

**A good story = dev subagent reads it once and starts coding. No research required.**

## Steps

### Step 1 — Understand the Feature

Before writing, gather:
- What feature is this? (read `docs/brief.md` if needed)
- Which Acceptance Criteria make this "done"?
- What does the user experience end-to-end?

### Step 2 — Write the Story Statement

Format: "As a {role}, I want {action}, so that {benefit}"

Rules:
- Role must be specific (not "user" — say "registered user", "admin", "guest shopper")
- Action must be a single, concrete action
- Benefit must explain real user value, not just re-state the action

### Step 3 — Write Acceptance Criteria

Rules for good ACs:
- Each AC must be independently testable
- Each AC describes a verifiable outcome, not an implementation
- Use: "Given [context], When [action], Then [outcome]" format OR plain numbered statements
- Minimum 3 ACs; maximum 8 (split into two stories if more needed)
- ACs must cover the happy path AND at least one error/edge case

### Step 4 — Break into Tasks

Rules for tasks:
- Each task maps to 1–3 ACs
- Tasks are ordered by dependency (what must be done first?)
- Each task has 1–3 subtasks (specific implementation steps)
- Subtasks are concrete enough to check off when done
- Include a test-writing subtask for each task

### Step 5 — Write Dev Notes

This is the most important section. Rules:
- Pull ONLY from `docs/architecture.md` — never invent technical details
- Include: relevant file paths, component names, API endpoints, data model fields
- Include: patterns to follow (state management, error handling, API call pattern)
- If previous story introduced relevant changes, summarize them here
- The dev subagent should NEVER need to read architecture docs after reading this section

### Step 6 — Save the Story

Name the file: `docs/stories/{n}.{kebab-title}.story.md`
Where `{n}` is the next sequential number.

Set status to `Draft` initially.
Ask user: "Should we approve this story now, or review it first?"
If approved, set status to `Approved`.
