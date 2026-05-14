---
name: architecture-design
description: "Use when: defining the tech stack, documenting architecture decisions, creating ADRs, or producing docs/architecture.md so dev subagents can build without research."
---

# Skill: Architecture Design

## Purpose

Produce a `docs/architecture.md` that is so complete and specific that any dev subagent (**#4 fe-dev** or **#5 be-dev**) can start coding immediately without reading any other document.

**The architecture doc is a contract.** Dev subagents must not invent decisions — they must follow what is documented here.

## Steps

### Step 1 — Understand the Brief

Read `docs/brief.md` fully. Extract:
- What the product does (to understand data and flows)
- The target users (to understand load/scale expectations)
- The MVP features (to scope what needs architecture decisions)
- Constraints (time, team, tech preferences)

### Step 2 — Decide the Stack

Present the user with exactly 2 stack options. For each option include:
- Name of the stack / pattern
- Key technologies (framework, DB, hosting)
- Why it fits this project
- Key trade-off or risk

Wait for user to choose. Do not skip this step.

**Hackathon default heuristics:**
- Prefer frameworks the team already knows over "optimal" choices
- Choose a platform with zero-config deploys (Vercel, Railway, Render)
- Use a managed database unless there's a strong reason not to
- Avoid microservices — monolith or BFF pattern first

### Step 3 — Define the Structure

Using the chosen stack, define:
1. The folder structure (full tree)
2. Where frontend code lives
3. Where backend/API code lives
4. Where config, types, and shared utilities live
5. Naming conventions for files and folders

### Step 4 — Document All Sections

Use `adr-template.md` as the basis and fill in `docs/architecture.md`.

Required sections (none can be left as "TBD"):
- Tech Stack table (with versions)
- Project Folder Structure (full tree)
- FE ↔ BE Communication pattern
- Data Model (all entities with fields)
- API Endpoints (all routes with method, path, auth requirement)
- Environment Variables (all vars with descriptions)
- Dev Setup commands
- Deployment commands

### Step 5 — Review Critical Decisions

Check each decision with user before saving:
- "Does the folder structure make sense for the team?"
- "Are all required env vars listed?"
- "Is the data model complete for the MVP features?"

### Step 6 — Save and Hand Off

Save to `docs/architecture.md`.
Tell user: "Architecture is complete. Switch to **#4 fe-dev** for frontend and/or **#5 be-dev** for backend (parallel is OK)."
