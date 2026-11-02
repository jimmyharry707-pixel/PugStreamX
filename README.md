# PugStreamX

A live-streaming site built with Next.js (App Router, Cache Components) and MongoDB.

## Setup

1. Start MongoDB locally, or create a free cluster on MongoDB Atlas.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI` (and optionally `MONGODB_DB`).
3. Install and seed:

   ```bash
   npm install
   npm run db:seed   # loads sample categories/streams and creates indexes; safe to re-run
   npm run dev       # http://localhost:3000
   ```

`npm run build` reads from the database to prerender pages, so MongoDB must be reachable at build time.

## Structure

```
scripts/
  seed.ts, seed-data.ts   # sample data + indexes (npm run db:seed)
src/
  lib/
    mongodb.ts            # shared MongoClient + typed collections (server-only)
    data.ts               # all queries; reads cached with "use cache" + cacheTag
    types.ts              # Stream / Category document types
  app/
    page.tsx              # home
    browse/page.tsx       # category filter + search
    watch/[id]/page.tsx   # stream page with chat
    api/
      categories/         # GET  /api/categories
      streams/            # GET  /api/streams?category=&q=   POST /api/streams
      streams/[id]/       # GET  /api/streams/:id
```

To add a collection: add its type to `types.ts`, expose it from `getCollections()` in `mongodb.ts`,
and put its queries in `data.ts`. After a write, call `revalidateTag("<tag>", "max")` (route handlers)
or `updateTag("<tag>")` (server actions) so cached reads refresh.

## API

```bash
curl localhost:3000/api/streams?category=gaming
curl -X POST localhost:3000/api/streams -H 'content-type: application/json' \
  -d '{"title":"My stream","streamer":"Me","category":"coding","tags":["Next.js"]}'
```

`POST /api/streams` has no authentication yet. Add auth before deploying publicly.
