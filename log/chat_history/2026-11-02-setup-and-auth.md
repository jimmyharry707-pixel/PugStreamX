# Session 2026-11-02: project setup, MongoDB, project rules, email/password auth

Participants: project owner (user) and Claude Code.
Outcome: a Next.js 16 + MongoDB app with custom email/password sign-up and sign-in. After sign-in it shows "Hello World".

---

## 1. Timeline of requests and what was done

### 1.1 "Make the website with nextjs"
- The folder was empty. Scaffolded with `create-next-app` (TypeScript, Tailwind v4, App Router, `src/`, Turbopack, ESLint).
- npm rejects capital letters in package names, so the app was scaffolded into `pugstreamx/` and moved to the root. `package.json` name is `pugstreamx`.
- Built a pug-themed streaming demo (home, browse, watch pages, simulated chat) with mock data.
  **All of this was deleted later (see 1.4).**

### 1.2 "Make the basic structure that can use MongoDB"
- A local MongoDB Windows service was already running at `mongodb://127.0.0.1:27017`.
- Chose the official `mongodb` driver (not Mongoose). The user was told and didn't object.
- Added a cached data layer (`"use cache"` + `cacheTag`), API routes, and a seed script.
  **All of this was deleted later (see 1.4).** Only the connection pattern survived.

### 1.3 Project rules (user's words, paraphrased)
> All basic components with `ps-`. Suggest a commit name at the end. Make the project scalable.
> MongoDB database name "PugStreamX"; every collection name starts with "ps_".

Written into `CLAUDE.md` (the source of truth for rules). Interpretation agreed:
- Component files are `ps-<name>.tsx`, with named exports `Ps<Name>`.
  - `src/components/ui`: basic components.
  - `src/components/layout`: app shell.
  - `src/features/<feature>/components`: feature components.
- The database name is fixed as `DB_NAME = "PugStreamX"` in `src/lib/db/config.ts` and is not an env var.
- Collections are registered in `COLLECTIONS`, typed `satisfies Record<string, \`ps_${string}\`>`, so a non-`ps_` name fails type-checking. This was verified.
- Feature-folder architecture: `types / queries / mutations / validation / actions / components`.
- Every task ends with a Conventional Commits message suggestion. Never commit unless asked.
  The project is **not a git repo yet**.

### 1.4 "Start the project: sign-in and sign-up, email + password only (more fields later). Remove existing pages. After sign-in only show 'Hello World'."
Claude asked three questions; the user's answers:
| Question | Answer |
| --- | --- |
| Auth approach | **Custom-built** (no Auth.js / Better Auth) |
| Old streaming code | **Delete everything**: pages, features, API routes, seed script, and the `ps_streams`/`ps_categories` collections (they held only seed data) |
| Signed-in page | **"Hello World" + Sign out button** |

Built (see section 3). Verified by an end-to-end test of 26 checks: sign-up, sign-in, sign-out, validation, duplicate email, forged/revoked cookies, DB contents, indexes.

### 1.5 Bug report: `Route "/": Next.js encountered the unstable value new Date() while prerendering`
- Cause: `getCurrentUser()` calls `new Date()` to filter expired sessions.
  With `partialPrefetching: true`, Next.js prerenders cookie-derived content for prefetch, so `cookies()` does **not** stop prerendering.
- Fix: `await connection()` (from `next/server`) before the session query in `src/features/auth/dal.ts`.
- Verified: the server log went from 24 errors to 0. Lesson: **check the server log, not just HTTP responses.**

---

## 2. Suggested commit messages so far (nothing committed)
1. `feat: add ps- component library, feature-based structure, and PugStreamX MongoDB naming rules`
2. `feat(auth): add email/password sign-up and sign-in with MongoDB sessions, replace streaming pages`
3. `fix(auth): run session lookup at request time to avoid new Date() prerender error`

---

## 3. Current state of the project

### Pages
| Path | Access | Content |
| --- | --- | --- |
| `/signup` | signed out | email + password form (password ≥ 8 chars) |
| `/signin` | signed out | email + password form |
| `/` | signed in | "Hello World" + Sign out |

### Key files
- `src/proxy.ts`: optimistic redirect to `/signin` when there is no `ps_session` cookie. It only checks that the cookie exists.
- `src/features/auth/`
  - `constants.ts`: cookie name, session lifetime (30 days), public routes, password lengths. No server-only imports, because Proxy uses it.
  - `password.ts`: scrypt hashes (`scrypt$N$r$p$salt$hash`) and a dummy hash so sign-in takes equal time whether or not the email exists.
  - `session.ts`: random 32-byte token in an httpOnly, SameSite=Lax cookie. The DB stores only its SHA-256 as `_id`.
  - `dal.ts`: `getCurrentUser()` and `requireUser()`, **the real auth check**. Uses `connection()`.
  - `validation.ts`: zod v4 schemas. Email is trimmed and lowercased.
  - `actions.ts`: `signUp`, `signIn`, `signOut` server actions, using `useActionState` state.
  - `components/`: `PsAuthCard`, `PsSignInForm`, `PsSignUpForm`, `PsSignOutButton`, `PsRedirectIfSignedIn`.
- `src/features/users/`: `UserDoc` (never send it to the client), `PublicUser`, `findUserByEmail/ById`, `createUser`. A duplicate email is caught via error 11000.
- `src/lib/db/`
  - `config.ts`: `DB_NAME`, `COLLECTIONS`, `INDEXES`.
  - `client.ts`: a single cached connection; creates indexes on first connect; failed connections aren't cached.
- `src/components/ui/`: `PsButton` / `PsLinkButton`, `PsInput`, `PsFormField`, `PsAlert`, `PsBadge`, `PsAvatar`, `PsChip`, `PsSection`, `PsEmptyState`.
- `src/components/layout/`: `PsContainer`.

### Database (`PugStreamX`)
- `ps_users`: `{ _id, email (unique, lowercased), passwordHash, createdAt, updatedAt }`
- `ps_sessions`: `{ _id: sha256(token), userId, createdAt, expiresAt }`. Has a TTL index on `expiresAt` and an index on `userId`.

### Env
- `.env.local` holds `MONGODB_URI=mongodb://127.0.0.1:27017`. `.env.example` is committed (allowed through `.gitignore`).

---

## 4. Gotchas learned (read before changing things)
- **This is Next.js 16.4 with `cacheComponents` and `partialPrefetching` on.** Read `node_modules/next/dist/docs/` before using an API (see `AGENTS.md`).
  - Reading `cookies()`, `searchParams` or uncached data outside `<Suspense>` makes the build fail.
  - `new Date()` / `Math.random()` during render needs `await connection()` first, **even after `cookies()`**.
  - `middleware.ts` is now `src/proxy.ts`. Export `proxy`.
  - `revalidateTag(tag, "max")` takes two arguments. `updateTag` works only in server actions.
  - With Cache Components, `generateStaticParams` must return at least one item.
  - Typed helpers `PageProps<"/path">`, `LayoutProps<"/">` and `RouteContext<"/api/...">` are global. `params` and `searchParams` are Promises.
- MongoDB on Windows refuses databases whose names differ only by case. The old `pugstreamx` DB was dropped for this reason.
- `"server-only"` modules can't be imported by `src/proxy.ts`. Keep shared constants in plain files.
- Client components must not import zod schemas, because that ships zod to the browser. Constants live in `constants.ts`.
- In the no-JS form-POST response, action state appears in the React payload, not as rendered HTML. Tests should assert on the payload JSON.
- Machine: Windows, PowerShell plus Git Bash. **Python is not installed**; use Node for scripts. `tsx` was removed.
  For one-off DB scripts use `node --env-file=.env.local -e '...'` with CommonJS `require("mongodb")` and no top-level await.

---

## 5. Open items / next steps
- **Add fields to sign-up** (the user said they'll do this next). Steps are in the `CLAUDE.md` "Authentication" section.
- No rate limiting on sign-in/sign-up yet. Needed before going public.
- The JS-enabled UI was never clicked through in a real browser. Tests submitted the forms directly over HTTP.
- No email verification or password reset.
- Not a git repository yet. Offer `git init` when the user wants to commit.
