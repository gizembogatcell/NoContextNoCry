# Repository guide for AI / Cursor

## What this repo is

- **Next.js 16** App Router app under `src/` (TypeScript, strict).
- **Ant Design 6** with `@ant-design/nextjs-registry` for correct CSS-in-JS with RSC.
- **Firebase Auth** (client-only): `src/lib/firebase/client.ts`, `AuthProvider` in `src/contexts/auth-context.tsx`.
- **MongoDB Atlas** for persistence: `src/lib/mongodb/client.ts`, services in `src/services/`.

## Commands to reference

```bash
npm run dev
npm run build
npm run lint
npm run format
npm test
```

## Conventions

1. **No Firebase in Server Components** — initialize only through `getFirebaseApp` / `getFirebaseAuth` (used from client components / hooks).
2. **Env**: `NEXT_PUBLIC_FIREBASE_API_KEY` etc. See `.env.local.example`.
3. **UI**: Prefer antd primitives (`Button`, `Form`, `Layout`). Theme via `ConfigProvider` in `src/app/providers.tsx`. Tokens: `src/theme/antd-theme.ts`.
4. **Auth guard**: Copy the `(app)/layout.tsx` pattern for new protected route groups.
5. **Validation**: Use Zod schemas at all boundaries (API input, API responses, env). Never use `as` type casts on unknown data.
6. **Error boundaries**: Every route group must have an `error.tsx` file.

## What to @ in Cursor

- `README.md` — stack + routes + architecture diagram.
- `docs/architecture.md` — detailed stack decisions and folder boundaries.
- `src/lib/firebase/client.ts` — Firebase entry.
- `src/contexts/auth-context.tsx` — auth state.
- `src/theme/antd-theme.ts` — brand tokens and theme config.
