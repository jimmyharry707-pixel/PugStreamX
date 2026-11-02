# PugStreamX

Next.js (App Router, Cache Components) + MongoDB. Project conventions are in [CLAUDE.md](CLAUDE.md).

## Setup

1. Start MongoDB locally, or create a cluster on MongoDB Atlas.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI`.
3. Run:

   ```bash
   npm install
   npm run dev   # http://localhost:3000
   ```

Collections and indexes are created automatically on first use.

## Pages

| Path      | Who               | What                                   |
| --------- | ----------------- | -------------------------------------- |
| `/signup` | signed-out users  | create an account (email + password)   |
| `/signin` | signed-out users  | sign in                                |
| `/`       | signed-in users   | "Hello World" and a sign-out button    |

Signed-out visitors are sent to `/signin`; signed-in visitors are sent away from `/signin` and `/signup`.

## Database

| Item     | Name          | Notes                                                        |
| -------- | ------------- | ------------------------------------------------------------ |
| Database | `PugStreamX`  | fixed in `src/lib/db/config.ts`                              |
| Users    | `ps_users`    | unique `email` (lowercased); password stored as scrypt hash   |
| Sessions | `ps_sessions` | `_id` = SHA-256 of the cookie token; auto-deleted on expiry  |

Sessions last 30 days.

## Structure

```
src/
  proxy.ts                       redirects signed-out visitors to /signin
  app/
    (auth)/signin, (auth)/signup sign-in / sign-up pages
    page.tsx                     Hello World (signed in)
  components/ui/                 ps-button, ps-input, ps-form-field, ps-alert, …
  features/
    auth/                        actions, dal, session, password, validation, components/ps-*
    users/                       types, queries, mutations
  lib/db/                        config.ts (names, indexes), client.ts (connection)
```
