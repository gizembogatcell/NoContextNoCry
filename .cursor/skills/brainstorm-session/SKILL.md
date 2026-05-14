---
name: brainstorm-session
description: "Use when: facilitating a structured brainstorm session, exploring a problem space, generating ideas for a hackathon project. Runs a multi-step ideation workflow with proven brainstorming techniques."
---

# Skill: Brainstorm Session

## Purpose

Run a structured, time-boxed brainstorm session. Produces a ranked list of ideas and a summary document ready for the Analyst phase.

## Steps

### Step 1 — Frame the Problem (5 min)

Ask these questions one at a time, wait for each answer:

1. "What problem are we trying to solve? Describe it in one sentence."
2. "Who experiences this problem? Be specific — who is the user?"
3. "Why do existing solutions fail or not exist?"
4. "What does success look like after the hackathon?"

Document answers as the **Problem Frame**.

### Step 2 — Diverge: Generate Ideas (10 min)

Apply 3 of the following techniques (choose based on the problem type).
See `techniques.md` for full descriptions.

**For well-defined problems**: What-If Scenarios, SCAMPER, Reversal/Inversion
**For vague problems**: Five Whys, First Principles, Assumption Reversal
**For creative problems**: Random Stimulation, Forced Relationships, Role Playing

For each technique:
- State the technique name
- Ask one stimulus question
- Wait for user's ideas
- Build on them with "Yes, and..."
- Generate 3–5 ideas per technique

**Target: 10–15 raw ideas total**

### Step 3 — Converge: Cluster and Rank (5 min)

1. Group ideas into 3–5 themes
2. For each theme, write one "concept headline" (problem + solution in one sentence)
3. Score each concept with a quick RICE estimate:
   - **Reach**: How many users? (1=few, 5=many)
   - **Impact**: How much value? (1=low, 5=high)
   - **Confidence**: How sure are we? (1=guess, 5=validated)
   - **Effort**: How hard? (1=easy, 5=hard) — divide by this
   - **Score** = (Reach × Impact × Confidence) / Effort

### Step 4 — Select and Frame Top Concept (5 min)

For the highest-scoring concept, produce:

```
CONCEPT: {name}
Problem: {one sentence}
Target User: {specific person}
Solution: {what we build}
Key Features:
  - {feature 1}
  - {feature 2}
  - {feature 3}
Key Risk: {biggest unknown}
```

### Step 5 — Save Output

Write the full session output to `docs/brainstorm-notes.md` with:
- Problem Frame (from Step 1)
- All raw ideas (from Step 2)
- Ranked concepts with RICE scores (from Step 3)
- Selected concept with full frame (from Step 4)

Confirm file saved, then tell user: "Switch to **#2 analyst** (`02-analyst.md`) to create the project brief."
