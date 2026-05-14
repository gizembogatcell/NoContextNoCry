# Architecture Document Template

Use this template when generating `docs/architecture.md`.
Replace all `{placeholders}` with real, specific content.
No "TBD" sections are allowed — if undecided, record it as an open ADR.

---

```markdown
# Architecture: {Project Name}

> Last Updated: {date}
> Architect: Jordan

---

## Tech Stack

| Layer      | Technology                     | Version     | Reason                       |
| ---------- | ------------------------------ | ----------- | ---------------------------- |
| Frontend   | {e.g. Next.js}                 | {e.g. 14.x} | {e.g. team familiarity, SSR} |
| Backend    | {e.g. Express / Next.js API}   | {version}   | {reason}                     |
| Database   | {e.g. Supabase / SQLite}       | {version}   | {reason}                     |
| Auth       | {e.g. NextAuth / Clerk / none} | {version}   | {reason}                     |
| Styling    | {e.g. Tailwind CSS}            | {version}   | {reason}                     |
| Deployment | {e.g. Vercel}                  | -           | {reason}                     |

---

## Project Structure
```

{project-root}/
├── src/
│ ├── app/ # {description}
│ ├── components/ # {description}
│ ├── lib/ # {description}
│ └── types/ # {description}
├── public/ # {description}
├── docs/ # Project documentation
└── {config files}

````

---

## FE ↔ BE Communication

**Pattern**: {REST / tRPC / GraphQL / Next.js Server Actions}

**Base URL**: `{e.g. /api}`

**Auth Header**: `{e.g. Authorization: Bearer <token>}`

**Error format**:
```json
{
  "error": "string describing what went wrong",
  "code": "MACHINE_READABLE_CODE"
}
````

---

## Data Model

### {Entity: e.g. User}

| Field      | Type      | Nullable | Description           |
| ---------- | --------- | -------- | --------------------- |
| id         | uuid      | No       | Primary key           |
| email      | string    | No       | Unique, used for auth |
| {field}    | {type}    | {Yes/No} | {description}         |
| created_at | timestamp | No       | Auto-set on insert    |

### {Entity: e.g. Item}

| Field   | Type   | Nullable | Description           |
| ------- | ------ | -------- | --------------------- |
| id      | uuid   | No       | Primary key           |
| user_id | uuid   | No       | Foreign key → User.id |
| {field} | {type} | {Yes/No} | {description}         |

---

## API Endpoints

| Method | Path                 | Description   | Auth Required |
| ------ | -------------------- | ------------- | ------------- |
| GET    | /api/{resource}      | {description} | Yes/No        |
| POST   | /api/{resource}      | {description} | Yes/No        |
| PUT    | /api/{resource}/{id} | {description} | Yes           |
| DELETE | /api/{resource}/{id} | {description} | Yes           |

---

## Environment Variables

Copy `.env.example` → `.env.local` to get started.

| Variable        | Description                        | Example / Source          |
| --------------- | ---------------------------------- | ------------------------- |
| DATABASE_URL    | Connection string for the database | Supabase dashboard        |
| NEXTAUTH_SECRET | Random secret for session signing  | `openssl rand -base64 32` |
| {VAR_NAME}      | {description}                      | {where to get it}         |

---

## Dev Setup

```bash
# 1. Install dependencies
npm install   # or pnpm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Run database migrations (if applicable)
{migration command}

# 4. Start development server
npm run dev

# 5. Run tests
npm test
```

---

## Deployment

**Platform**: {Vercel / Railway / Render / Fly.io}

```bash
# Build
npm run build

# Deploy (if CLI available)
{deploy command}
```

**Required env vars to set in platform dashboard:**

- {VAR_NAME}
- {VAR_NAME}

---

## Architecture Decision Records

### ADR-001: {Decision Title}

- **Status**: Accepted
- **Decision**: {what was decided}
- **Reason**: {why this was chosen}
- **Alternatives Considered**: {what else was evaluated and why rejected}
- **Consequences**: {what this means for the codebase}

```

```
