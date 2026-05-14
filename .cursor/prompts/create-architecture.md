---
description: Document architecture decisions and tech stack in docs/architecture.md. Use after the project brief is complete to define how the system will be built.
---

Create or update `docs/architecture.md` for this hackathon project.

## Instructions

1. Read `docs/brief.md` first. If it does not exist, ask the user to summarize the project.

2. Ask the user to confirm or choose the tech stack:
   - Frontend framework (React, Vue, Svelte, plain HTML, etc.)
   - Backend/API approach (Node/Express, FastAPI, Next.js API routes, serverless, etc.)
   - Database/storage (Postgres, SQLite, Redis, localStorage, Supabase, Firebase, etc.)
   - Deployment target (Vercel, Railway, Render, Fly.io, etc.)
   - Key third-party services (auth, payments, email, etc.)

3. Generate `docs/architecture.md` with this structure:

```markdown
# Architecture: {Project Name}

## Tech Stack

| Layer      | Technology        | Version   | Reason |
| ---------- | ----------------- | --------- | ------ |
| Frontend   | {e.g. Next.js}    | {version} | {why}  |
| Backend    | {e.g. Express}    | {version} | {why}  |
| Database   | {e.g. PostgreSQL} | {version} | {why}  |
| Deployment | {e.g. Vercel}     | -         | {why}  |

## Project Structure
```

{folder tree with one-line description per folder}

````

## FE ↔ BE Communication

{How frontend and backend talk: REST endpoints, tRPC, GraphQL, etc.
Include base URL convention and auth header pattern.}

## Data Model

### {Entity Name}
| Field | Type | Description |
| --- | --- | --- |
| id | string/uuid | Primary key |
| {field} | {type} | {description} |

## API Endpoints (if applicable)

| Method | Path | Description | Auth Required |
| --- | --- | --- | --- |
| GET | /api/{resource} | {description} | Yes/No |
| POST | /api/{resource} | {description} | Yes/No |

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| {VAR_NAME} | {what it is} | {non-sensitive example} |

## Dev Setup

```bash
# Install
{install command}

# Run locally
{dev command}

# Run tests
{test command}
````

## Deployment

```bash
# Build
{build command}

# Deploy
{deploy command or platform instructions}
```

## Architecture Decisions (ADRs)

### ADR-001: {Decision Title}

- **Decision**: {what was decided}
- **Reason**: {why}
- **Alternatives considered**: {what else was evaluated}

```

4. Review major sections with the user.
5. Save to `docs/architecture.md` and confirm.
```
