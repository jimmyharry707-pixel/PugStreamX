@AGENTS.md

# PugStreamX project rules

These rules are mandatory for all work in this repo.

## 1. Components use the `ps-` prefix

- Every React component file is named `ps-<name>.tsx` in kebab-case, e.g. `ps-button.tsx`, `ps-sign-in-form.tsx`.
- Each exports a named component `Ps<Name>` in PascalCase, e.g. `PsButton`, `PsSignInForm`. No default exports.
- Where components live:
  - `src/components/ui/`: basic reusable building blocks (`PsButton`, `PsInput`, `PsFormField`, `PsAlert`, `PsBadge`, `PsAvatar`, `PsChip`, `PsSection`, `PsEmptyState`). They have no data fetching and no feature knowledge.
  - `src/components/layout/`: app shell (`PsContainer`).
  - `src/features/<feature>/components/`: components tied to one feature.
- Build pages from existing `ps-` components before writing raw markup. If a pattern repeats, make it a new `ps-` component.
- Next.js special files (`page.tsx`, `layout.tsx`, `not-found.tsx`, `route.ts`, `proxy.ts`, …) keep their required names.

## 2. MongoDB naming

- The database name is **`PugStreamX`**, fixed as `DB_NAME` in `src/lib/db/config.ts`. Do not make it configurable or hard-code it elsewhere.
- Every collection name **must start with `ps_`** (e.g. `ps_users`, `ps_sessions`).
- Register every collection in `COLLECTIONS` in `src/lib/db/config.ts`. Its type rejects names without `ps_`. Add its indexes to `INDEXES` there too; they're created automatically on first connection.
- Access collections only through `getCollection<T>("<key>")` from `src/lib/db/client.ts`. Never use a raw string name.

## 3. Scalable structure

```
src/
  app/                  routes only: thin pages and route handlers that compose features
  proxy.ts              optimistic auth redirect (cookie presence only)
  components/ui/        ps-* basic components
  components/layout/    ps-* app shell
  features/<feature>/
    types.ts            document and input types
    queries.ts          reads, server-only (use "use cache" + cacheTag for shared, non-user data)
    mutations.ts        writes, server-only; callers invalidate any affected cache tag
    validation.ts       zod schemas for untrusted input
    actions.ts          server actions ("use server")
    components/         ps-* feature components
  lib/db/               config.ts (names/indexes) and client.ts (connection)
  lib/utils/            pure helpers (cn)
```

- A new domain area (profiles, follows, chat, …) gets its own folder under `src/features/`, using the same file layout.
- Pages, actions and route handlers never talk to MongoDB directly. They call a feature's `queries.ts` or `mutations.ts`.
- After a write to cached data, invalidate its tag: `revalidateTag(TAG, "max")` in route handlers, `updateTag(TAG)` in server actions.
- Import with the `@/` alias, except for relative imports inside the same feature.

## 4. Authentication

- Custom email + password auth. Users live in `ps_users`; sessions live in `ps_sessions`, stored as SHA-256 hashes of the random token in the `ps_session` cookie.
- `src/proxy.ts` only checks that the cookie exists. The real check is `getCurrentUser()` / `requireUser()` in `src/features/auth/dal.ts`. Every protected page, action and route handler must call one of these.
- Pages that read the session must do it inside `<Suspense>` (Cache Components).
- Never send `UserDoc` to the client. Use `toPublicUser()`.
- To add a sign-up field: update `signUpSchema` (`features/auth/validation.ts`), `ps-sign-up-form.tsx`, `UserDoc` (`features/users/types.ts`) and `CreateUserInput`. The `signUp` action passes non-password fields through.
- Public routes are listed in `PUBLIC_ROUTES` (`features/auth/constants.ts`). Everything else requires sign-in.

## 5. Finish every task with a commit message suggestion

At the end of every task, suggest a commit message in Conventional Commits format,
e.g. `feat(auth): add display name to sign-up`, in a code block the user can copy.
Do not commit unless the user asks.
