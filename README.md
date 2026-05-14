<div align="center">

![header](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=RetroMind&fontSize=40&fontAlignY=35&desc=AI-Powered%20Retrospectives%20for%20Software%20Teams&descAlignY=55&descSize=16)

[![skills](https://skillicons.dev/icons?i=ts,react,nextjs,nodejs,mongodb,firebase)](https://skillicons.dev)

**Team: No Context No Cry** | Turkcell AI Hackathon | 14 May 2026

</div>

# RetroMind

An AI-powered retrospective tool for software teams. RetroMind streamlines the entire retro lifecycle — anonymous sticky notes, AI-driven card grouping, dot voting, AI-generated action suggestions, email notifications with magic links, deadline tracking, and retro memory across sprints.

---

## AI Tools and Models Used

### Cursor IDE — AI Agent Pipeline

The entire development pipeline was driven by 7 numbered AI agents running inside Cursor IDE. Agent definitions live in `.cursor/agents/`, rules in `.cursor/rules/`, skills in `.cursor/skills/`.

| # | Agent | Role |
|---|-------|------|
| 1 | brainstorm | Facilitated structured ideation session, produced `docs/brainstorm-notes.md` |
| 2 | analyst | Extracted requirements into `docs/brief.md` and 8 user stories in `docs/stories/` |
| 3 | architect | Chose the tech stack, produced `docs/architecture.md` with ADRs |
| 4 | fe-dev | Implemented all React/Ant Design UI — retro board, voting, action panels |
| 5 | be-dev | Implemented API routes, services, AI proxy integration, email templates |
| 6 | tester | Ran lint, unit/integration tests, verified acceptance criteria |
| 7 | browser-e2e | Playwright E2E tests in headed Chromium (optional) |

Activate with: `act as #N agent-name` in Cursor chat. After `*handoff`, manually start the next agent.

### Turkcell AI Proxy (Anthropic-compatible)

Model: **`turkcell-glm`** accessed via `callAiProxy()` in `src/lib/api/ai-proxy.ts`.

Used for:
- **Card grouping** — clusters retro cards by theme (`/api/retros/[id]/ai/group`)
- **Action suggestions** — generates actionable follow-ups from grouped cards (`/api/retros/[id]/ai/actions`)
- **Mail content generation** — produces HTML email bodies for action assignments and summaries
- **Pre-retro summaries** — summarizes previous retro outcomes before the next session
- **AI chat** — conversational assistant for retro facilitation (`/api/ai/chat`)

### Resend API

Transactional email delivery for:
- Action assignment notifications (with magic link for quick status updates)
- Deadline check reminders (triggered via cron)
- Pre-retro summary emails

### Firebase Auth

Google and Email/Password authentication. Client-side via Firebase JS SDK, server-side token verification via Firebase Admin SDK.

### MongoDB Atlas

Primary database for all persistence — retros, cards, votes, groups, actions, users, conversations.

---

## MCP Servers

| Server | Purpose |
|--------|---------|
| `plugin-figma-figma` | Figma integration for design-to-code workflows |

---

## Integrated APIs

| API | Usage |
|-----|-------|
| Firebase Auth (Client SDK) | Google + Email/Password sign-in |
| Firebase Admin SDK | Server-side ID token verification |
| MongoDB Atlas | Database persistence |
| Turkcell AI Proxy (Anthropic-compatible) | LLM calls for grouping, actions, summaries, chat |
| Resend Email API | Transactional email delivery |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│  Browser (React 19, Ant Design 6)                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐    │
│  │(marketing)│  │  (auth)  │  │      (app)        │    │
│  │  landing  │  │  login   │  │ dashboard, retros │    │
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
│  └──────────────┘  └──────┬──────┘  └───────────────┘ │
│                           │                             │
│                    ┌──────▼──────┐  ┌───────────────┐  │
│                    │ AI Proxy    │  │ Resend Email  │  │
│                    │ (turkcell-  │  │ (transactional│  │
│                    │  glm)       │  │  mail)        │  │
│                    └─────────────┘  └───────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## Route Map

### Pages

| Path | Route Group | Auth | Description |
|------|-------------|------|-------------|
| `/` | `(marketing)` | Public | Landing page |
| `/login` | `(auth)` | Public | Email + Google sign-in |
| `/dashboard` | `(app)` | Protected | User dashboard |
| `/retros` | `(app)` | Protected | Retro list |
| `/retros/new` | `(app)` | Protected | Create new retro |
| `/retros/[id]` | `(app)` | Protected | Retro board (write, vote, actions, closed) |

### API Routes

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/api/users/me` | GET/PUT | Bearer | User profile |
| `/api/retros` | GET/POST | Bearer | List/create retros |
| `/api/retros/[id]` | GET | Bearer | Get retro (auto-checks timer) |
| `/api/retros/[id]/phase` | PATCH | Bearer | Advance retro phase |
| `/api/retros/[id]/cards` | GET/POST | Bearer | List/add cards |
| `/api/retros/[id]/cards/[cardId]/vote` | POST | Bearer | Vote on a card |
| `/api/retros/[id]/votes` | GET/POST | Bearer | Vote operations |
| `/api/retros/[id]/groups` | GET/PATCH | Bearer | Group operations |
| `/api/retros/[id]/ai/group` | POST | Bearer | AI card grouping |
| `/api/retros/[id]/ai/actions` | POST | Bearer | AI action suggestions |
| `/api/retros/[id]/actions` | GET/POST | Bearer | Action CRUD |
| `/api/actions/[id]` | GET/PATCH | Bearer | Single action ops |
| `/api/actions/summary` | GET | Bearer | Action summary for latest retro |
| `/api/actions/carry-over` | GET | Bearer | Carry-over actions |
| `/api/actions/magic/[token]` | GET/POST | Public | Magic link action update |
| `/api/cron/deadline-check` | GET | CRON_SECRET | Deadline check email trigger |
| `/api/ai/chat` | POST | Bearer | AI chat |
| `/api/ai/conversations` | GET/POST | Bearer | Conversation CRUD |
| `/api/ai/conversations/[id]` | GET/PUT/DELETE | Bearer | Single conversation |

---

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # fill in values from Firebase + Atlas consoles
npm run dev                         # http://localhost:3000
```

Requires **Node 20+**.

---

## Environment Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console &rarr; Project settings &rarr; Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console &rarr; Project settings &rarr; Your apps |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console &rarr; Project settings &rarr; Your apps |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console &rarr; Project settings &rarr; Your apps |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console &rarr; Project settings &rarr; Your apps |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console &rarr; Project settings &rarr; Your apps |
| `MONGODB_URI` | Atlas &rarr; Connect &rarr; Drivers |
| `MONGODB_DB_NAME` | Your Atlas database name |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Console &rarr; Service accounts |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Console &rarr; Service accounts |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Console &rarr; Service accounts &rarr; Generate private key |
| `AI_PROXY_BASE_URL` | Turkcell AI Proxy endpoint |
| `AI_PROXY_API_KEY` | Turkcell AI Proxy API key |
| `AI_MODEL_NAME` | AI model name (default: `turkcell-glm`) |
| `RESEND_API_KEY` | Resend Dashboard &rarr; API Keys |
| `RESEND_FROM_EMAIL` | Sender email address for transactional mail |
| `NEXT_PUBLIC_APP_URL` | Public app URL (used in email links and magic links) |
| `CRON_SECRET` | Shared secret for cron endpoint authentication |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages + layouts)
│   ├── (app)/              # Protected routes (auth guard in layout)
│   │   ├── ai-chat/        # AI chat page
│   │   ├── dashboard/      # User dashboard
│   │   └── retros/         # Retro list, create, board
│   ├── (auth)/             # Login / registration
│   │   └── login/
│   ├── (marketing)/        # Public landing page
│   └── api/                # Route handlers
│       ├── actions/        # Action CRUD, magic links, summary, carry-over
│       ├── ai/             # AI chat, conversations
│       ├── cron/           # Deadline check
│       ├── retros/         # Retro CRUD, cards, votes, groups, AI, actions
│       └── users/          # User profile
├── components/             # Shared UI components
│   ├── layout/             # Header, navigation
│   └── retro/              # Retro-specific components (board, cards, voting)
├── contexts/               # React contexts (AuthProvider)
├── hooks/                  # Custom hooks (useAuth)
├── lib/                    # Infrastructure
│   ├── api/                # Response helpers, auth middleware, AI proxy
│   ├── firebase/           # Client + Admin SDK init
│   ├── mongodb/            # Connection + DB helper
│   └── validations/        # Zod schemas
├── services/               # Business logic (server-only)
├── templates/              # HTML email templates (action assignment, deadline, summary)
├── theme/                  # Ant Design theme tokens
└── types/                  # Shared TypeScript types
```

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## Stack Conventions

- **UI**: Ant Design primitives via `ConfigProvider` in `src/app/providers.tsx`. Theme tokens live in `src/theme/antd-theme.ts`.
- **Auth (client)**: Firebase JS SDK. `AuthProvider` in `src/contexts/auth-context.tsx`. Protected routes use the `(app)/layout.tsx` guard pattern.
- **Auth (server)**: `requireUser()` in `src/lib/api/auth.ts` verifies Firebase ID tokens via `firebase-admin`.
- **Database**: MongoDB Atlas via cached client in `src/lib/mongodb/client.ts`. Used only from `services/` and API routes.
- **Validation**: Zod schemas in `src/lib/validations/`. Both API input and response parsing.
- **API responses**: Standardized `{ data }` / `{ error }` via `src/lib/api/response.ts`.
- **Email**: HTML templates in `src/templates/`, delivered via Resend API from services.

---

## Documentation

The `docs/` folder contains project documentation produced by the AI agent pipeline:

| File | Contents |
|------|----------|
| `docs/brief.md` | Project brief — problem, users, MVP features, constraints |
| `docs/architecture.md` | Technical architecture — stack, ADRs, data model, folder structure |
| `docs/brainstorm-notes.md` | Ideation session output |
| `docs/stories/*.story.md` | 8 user stories with acceptance criteria |

---

## Cursor Setup

- Index **Next.js** and **Ant Design** docs under Cursor Settings &rarr; Features &rarr; Docs.
- `@README.md` or `@AGENTS.md` when starting tasks.
- Rules in `.cursor/rules/`, skills in `.cursor/skills/`, prompts in `.cursor/prompts/`.

---

## Screenshots

Screenshots coming soon.

---

## Deployment

Development only — not yet deployed to production.

---

<div align="center">

![footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=120&section=footer)

</div>
