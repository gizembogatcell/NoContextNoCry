# Architecture

## Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 (App Router) | Server components, API routes, file-based routing |
| Language | TypeScript (strict) | Type safety across client and server |
| UI | Ant Design 6 + `@ant-design/nextjs-registry` | Rich component library with CSS-in-JS SSR support |
| Auth (client) | Firebase JS SDK | Google + email/password, zero backend session management |
| Auth (server) | Firebase Admin SDK | Stateless token verification in API routes |
| Database | MongoDB Atlas | Flexible schema, free tier, fast setup for hackathons |
| Validation | Zod | Runtime schema validation for env, API input, and API responses |

## Decisions

### Client-only auth (no middleware)

Firebase auth state lives entirely in the browser via `AuthProvider`. Protected routes use a client-side guard in `(app)/layout.tsx` that redirects to `/login` when unauthenticated. API routes verify tokens server-side via `requireUser()`. This avoids cookie/session complexity and keeps the auth flow transparent.

### Single ConfigProvider for theming

All Ant Design tokens are centralized in `src/theme/antd-theme.ts` and applied through a single `ConfigProvider` in `src/app/providers.tsx`. No nested providers. Theme switching is supported via `getThemeByKey()`.

### Service layer separation

API routes (`src/app/api/`) handle HTTP concerns only (parsing, auth, response formatting). Business logic lives in `src/services/` with `server-only` imports to prevent accidental client bundling. This keeps route handlers thin and testable.

### Standardized API responses

All API routes return `{ data }` on success or `{ error: { message, code, details? } }` on failure via helpers in `src/lib/api/response.ts`. Client code can rely on a consistent shape.

## Data flow

```
Browser → AuthProvider (Firebase JS SDK) → getIdToken()
       → fetch("/api/...", { Authorization: Bearer <token> })
       → API route → requireUser() (firebase-admin verifyIdToken)
       → service layer → MongoDB (via getDb())
       → response: { data } or { error }
```

## Folder boundaries

| Folder | Can import from | Cannot import from |
|--------|----------------|-------------------|
| `app/` (pages) | `components/`, `hooks/`, `contexts/`, `theme/`, `types/` | `services/`, `lib/mongodb/`, `lib/firebase/admin` |
| `components/` | `hooks/`, `types/`, `theme/` | `services/`, `lib/`, `contexts/` |
| `services/` | `lib/`, `types/` | `app/`, `components/`, `hooks/`, `contexts/` |
| `lib/api/` | `lib/firebase/admin`, `lib/env` | `services/`, `app/` |
