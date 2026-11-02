import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import StreamCard from "@/components/StreamCard";
import { getCategories, getStreams } from "@/lib/data";

export const metadata: Metadata = { title: "Browse" };

export default function BrowsePage({ searchParams }: PageProps<"/browse">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Browse</h1>
      <Suspense fallback={<p className="mt-6 text-zinc-500">Sniffing out streams…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/browse">, "searchParams">) {
  const { category, q } = await searchParams;
  const activeCategory = typeof category === "string" ? category : undefined;
  const query = typeof q === "string" ? q.trim() : "";

  const [results, categories] = await Promise.all([
    getStreams({ category: activeCategory, q: query || undefined }),
    getCategories(),
  ]);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm transition ${
      active ? "bg-amber-400 font-semibold text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
    }`;

  return (
    <>
      {query && <p className="mt-1 text-zinc-400">Results for &ldquo;{q}&rdquo;</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/browse" className={pill(!activeCategory)}>All</Link>
        {categories.map((c) => (
          <Link key={c.slug} href={`/browse?category=${c.slug}`} className={pill(activeCategory === c.slug)}>
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      {results.length > 0 ? (
        <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((stream) => (
            <StreamCard key={stream.id} stream={stream} category={categoryBySlug.get(stream.category)} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center text-zinc-400">
          <p className="text-5xl">🐾</p>
          <p className="mt-4">No streams found. Even the pugs are napping.</p>
        </div>
      )}
    </>
  );
}
