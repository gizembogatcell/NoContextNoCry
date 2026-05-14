<div align="center">

![header](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=Retro%20Tool%202026&fontSize=40&fontAlignY=35&desc=Next.js%2016%20%7C%20TypeScript%20%7C%20Ant%20Design%206%20%7C%20Firebase%20%7C%20MongoDB&descAlignY=55&descSize=16)

[![skills](https://skillicons.dev/icons?i=ts,react,nextjs,nodejs,mongodb,firebase)](https://skillicons.dev)

</div>

# AI Hackathon Template

Next.js 16 (App Router) + TypeScript + Ant Design 6 + Firebase Auth + MongoDB Atlas.
Includes a structured AI-agent pipeline for hackathon execution.

---

## Architecture overview

```
┌────────────────────────────────────────────────────────┐
│  Browser (React 19, Ant Design 6)                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐    │
│  │ (marketing)│  │  (auth)  │  │     (app)         │    │
│  │  page.tsx │  │ login    │  │ dashboard (guard)  │    │
│  └──────────┘  └──────────┘  └───────────────────┘    │
│         │            │               │                  │
│         └────────────┴───────────────┘                  │
│                      │                                  │
│              AuthProvider (Firebase JS SDK)              │
│              ConfigProvider (Ant Design theme)           │
└────────────────────────┬───────────────────────────────┘
                         │  Bearer token
┌────────────────────────▼───────────────────────────────┐
│  Next.js API Routes (server)                            │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐ │
│  │ requireUser() │→ │ services/*  │→ │ MongoDB Atlas │ │
│  │ (firebase-    │  │ (business   │  │ (persistence) │ │
│  │  admin verify)│  │  logic)     │  │               │ │
│  └──────────────┘  └─────────────┘  └───────────────┘ │
└────────────────────────────────────────────────────────┘
```

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in values from Firebase + Atlas consoles
npm run dev                         # http://localhost:3000
```

Requires **Node 20+**.

### Environment variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project settings → Your apps |
| `MONGODB_URI` | Atlas → Connect → Drivers |
| `MONGODB_DB_NAME` | Your Atlas database name |
| `FIREBASE_ADMIN_*` | Firebase Console → Service accounts → Generate private key |

## Route map

| Path | Route group | Auth | Description |
|------|-------------|------|-------------|
| `/` | `(marketing)` | Public | Landing page |
| `/login` | `(auth)` | Public | Email + Google sign-in |
| `/dashboard` | `(app)` | Protected | User profile from MongoDB |
| `/api/users/me` | API | Bearer token | GET/PUT user profile |

## Project structure

```
src/
├── app/                    # Next.js App Router (pages + layouts only)
│   ├── (app)/              # Protected routes (auth guard in layout)
│   ├── (auth)/             # Login / registration
│   ├── (marketing)/        # Public pages
│   └── api/                # Route handlers
├── components/             # Shared UI components
│   └── layout/             # Header, navigation
├── contexts/               # React contexts (AuthProvider)
├── hooks/                  # Custom hooks (useAuth)
├── lib/                    # Infrastructure
│   ├── api/                # Response helpers, auth middleware
│   ├── firebase/           # Client + Admin SDK init
│   ├── mongodb/            # Connection + DB helper
│   └── validations/        # Zod schemas
├── services/               # Business logic (server-only)
├── theme/                  # Ant Design theme tokens
└── types/                  # Shared TypeScript types
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

## Stack conventions

- **UI**: Ant Design primitives via `ConfigProvider` in `src/app/providers.tsx`. Theme tokens live in `src/theme/antd-theme.ts`.
- **Auth (client)**: Firebase JS SDK. `AuthProvider` in `src/contexts/auth-context.tsx`. Protected routes use the `(app)/layout.tsx` guard pattern.
- **Auth (server)**: `requireUser()` in `src/lib/api/auth.ts` verifies Firebase ID tokens via `firebase-admin`.
- **Database**: MongoDB Atlas via cached client in `src/lib/mongodb/client.ts`. Used only from `services/` and API routes.
- **Validation**: Zod schemas in `src/lib/validations/`. Both API input and response parsing.
- **API responses**: Standardized `{ data }` / `{ error }` via `src/lib/api/response.ts`.

## AI agent pipeline

Agents in `.cursor/agents/` follow a numbered sequence:

| # | Agent | Output |
|---|-------|--------|
| 1 | brainstorm | `docs/brainstorm-notes.md` |
| 2 | analyst | `docs/brief.md` + `docs/stories/*.story.md` |
| 3 | architect | `docs/architecture.md` |
| 4 | fe-dev | Frontend implementation |
| 5 | be-dev | Backend implementation |
| 6 | tester | Lint, tests, AC verification |
| 7 | browser-e2e | Playwright E2E (optional) |

Activate with: `act as #N agent-name` in Cursor chat. After `*handoff`, manually start the next agent.

## Cursor setup

- Index **Next.js** and **Ant Design** docs under Cursor Settings → Features → Docs.
- `@README.md` or `@AGENTS.md` when starting tasks.
- Rules in `.cursor/rules/`, skills in `.cursor/skills/`, prompts in `.cursor/prompts/`.

---

<div align="center">

![footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=120&section=footer)

</div>
