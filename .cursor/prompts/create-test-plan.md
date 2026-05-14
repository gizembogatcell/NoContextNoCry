---
description: Create a test plan for a feature or story. Use when preparing QA validation or planning test coverage before or after implementation.
---

Create a structured test plan for a feature or story.

## Instructions

1. Ask: "Which feature or story are we creating a test plan for?" If a story file path is provided, read it from `docs/stories/`.

2. Ask: "Is this a frontend feature, backend feature, or full-stack?" to set the right scope.

3. Generate a test plan with the following structure:

```markdown
# Test Plan: {Feature / Story Name}

**Story file**: `docs/stories/{file}.story.md`
**Date**: {today}
**Tester**: Casey (QA)

---

## Scope

{Brief description of what is being tested}

---

## Happy Path Scenarios

| #   | Scenario             | Steps              | Expected Result      | Priority |
| --- | -------------------- | ------------------ | -------------------- | -------- |
| 1   | {Normal use case}    | {1. do x, 2. do y} | {what should happen} | Critical |
| 2   | {Another happy path} | {steps}            | {expected}           | High     |

---

## Edge Cases

| #   | Scenario           | Input / Condition            | Expected Result          | Priority |
| --- | ------------------ | ---------------------------- | ------------------------ | -------- |
| 1   | Empty input        | {e.g. empty form field}      | {validation error shown} | High     |
| 2   | Boundary value     | {e.g. max length}            | {handled gracefully}     | Medium   |
| 3   | Special characters | {e.g. SQL injection attempt} | {sanitized / rejected}   | High     |

---

## Negative / Error Scenarios

| #   | Scenario               | Condition            | Expected Result              | Priority |
| --- | ---------------------- | -------------------- | ---------------------------- | -------- |
| 1   | Unauthorized access    | User not logged in   | 401 / redirect to login      | Critical |
| 2   | Invalid data           | Malformed request    | 400 with clear error message | High     |
| 3   | Missing required field | Blank required input | Validation error, not crash  | High     |

---

## Acceptance Criteria Checklist

> Copy ACs from story and verify each one:

- [ ] AC 1: {description} — PASS / FAIL
- [ ] AC 2: {description} — PASS / FAIL
- [ ] AC 3: {description} — PASS / FAIL

---

## Notes

{Any special test setup, test data needed, or known limitations}
```

4. Present the plan to the user for review.
5. Ask if they want to save it alongside the story file at `docs/stories/{n}.{title}.test-plan.md`.
