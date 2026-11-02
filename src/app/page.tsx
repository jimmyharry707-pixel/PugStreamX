import Link from "next/link";
import StreamCard from "@/components/StreamCard";
import { getCategories, getCategoryViewerTotals, getStreams } from "@/lib/data";
import { formatViewers } from "@/lib/format";

export default async function Home() {
  const [streams, categories, viewerTotals] = await Promise.all([
    getStreams({ limit: 9 }),
    getCategories(),
    getCategoryViewerTotals(),
  ]);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  if (streams.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-6xl">🐶💤</p>
        <h1 className="mt-6 text-2xl font-bold">No streams yet</h1>
        <p className="mt-2 text-zinc-400">
          The database is empty. Run <code className="rounded bg-zinc-800 px-1.5 py-0.5">npm run db:seed</code> to load
          sample streams.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = streams;

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-8">
      {/* Hero / featured stream */}
      <section className="grid items-center gap-8 lg:grid-cols-[3fr_2fr]">
        <Link
          href={`/watch/${featured.id}`}
          className={`group relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br ${featured.gradient}`}
        >
          <span className="absolute inset-0 grid place-items-center text-8xl transition group-hover:scale-110">🐶</span>
          <span className="absolute left-4 top-4 rounded bg-red-600 px-2 py-1 text-xs font-bold uppercase">Live</span>
          <span className="absolute bottom-4 left-4 rounded bg-black/70 px-2 py-1 text-sm">
            {formatViewers(featured.viewers)} watching
          </span>
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">Featured stream</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{featured.title}</h1>
          <p className="mt-3 text-zinc-400">
            {featured.streamer} is live right now. Grab a snack, pull up a dog bed, and join the chat.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {featured.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{tag}</span>
            ))}
          </div>
          <Link
            href={`/watch/${featured.id}`}
            className="mt-6 inline-block rounded-full bg-amber-400 px-6 py-3 font-semibold text-zinc-950 hover:bg-amber-300"
          >
            Watch now
          </Link>
        </div>
      </section>

      {/* Live channels */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">Live channels we think you&apos;ll like</h2>
          <Link href="/browse" className="text-sm text-amber-400 hover:underline">Show all</Link>
        </div>
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((stream) => (
            <StreamCard key={stream.id} stream={stream} category={categoryBySlug.get(stream.category)} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Browse categories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/browse?category=${c.slug}`}
              className={`group flex aspect-[3/4] flex-col justify-end rounded-xl bg-gradient-to-br ${c.gradient} p-4 transition hover:-translate-y-1`}
            >
              <span className="mb-auto text-4xl transition group-hover:scale-110">{c.emoji}</span>
              <span className="font-bold">{c.name}</span>
              <span className="text-xs text-white/80">{formatViewers(viewerTotals[c.slug] ?? 0)} viewers</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
