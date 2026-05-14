---
name: requirements-analysis
description: "Use when: turning brainstorm output into a structured project brief, eliciting requirements from a stakeholder, or documenting what a hackathon project must do. Produces docs/brief.md."
---

# Skill: Requirements Analysis

## Purpose

Transform raw ideas or brainstorm output into a clear, actionable project brief. The brief serves as the single source of truth for the entire hackathon.

## Steps

### Step 1 — Gather Inputs

Check for existing inputs in this order:
1. `docs/brainstorm-notes.md` — read if present
2. Ask: "Can you describe the project in 2–3 sentences?" if no notes file

### Step 2 — Elicit Core Requirements

Ask each question, wait for a full answer before asking the next:

1. "What is the ONE problem this project solves? (one sentence)"
2. "Who is the primary user? Be specific — not 'everyone'."
3. "What does the user currently do to solve this problem?"
4. "What would success look like at the demo?"
5. "What are the 3–5 features that MUST exist for the demo to work?"
6. "What are we explicitly NOT building in this hackathon?"
7. "What are the constraints? (time box, team size, tech preferences)"

### Step 3 — Clarify and Challenge

For each stated feature, ask:
- "Who specifically needs this?"
- "What happens if we cut this? Is it truly 'must-have'?"
- "How will we know when this is done?"

This step converts vague wishes into testable acceptance criteria.

### Step 4 — Draft the Brief

Use `brief-template.md` in this folder to generate `docs/brief.md`.

Fill every section — no "TBD" allowed. If information is unknown, flag it explicitly as a risk.

### Step 5 — Review and Confirm

Read back the brief section by section. Ask:
- "Does this accurately capture what we're building?"
- "Is the MVP scope realistic for the time available?"
- "Are the success criteria testable?"

Get explicit user confirmation before saving.

### Step 6 — Save and Hand Off

Save to `docs/brief.md`.
Tell user: "Brief is complete. Switch to **#3 architect** (`03-architect.md`) to define the tech stack."
