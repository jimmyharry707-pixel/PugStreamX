import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Chat from "@/components/Chat";
import StreamCard from "@/components/StreamCard";
import { getCategory, getStream, getStreamIds, getStreams } from "@/lib/data";
import { formatViewers } from "@/lib/format";

export async function generateStaticParams() {
  const ids = await getStreamIds();
  // Cache Components requires at least one param, so an empty database would otherwise fail
  // the build. The placeholder just prerenders the not-found page.
  return ids.length > 0 ? ids.map((id) => ({ id })) : [{ id: "placeholder" }];
}

export async function generateMetadata({ params }: PageProps<"/watch/[id]">): Promise<Metadata> {
  const { id } = await params;
  const stream = await getStream(id);
  return { title: stream ? `${stream.streamer} — ${stream.title}` : "Stream not found" };
}

export default async function WatchPage({ params }: PageProps<"/watch/[id]">) {
  const { id } = await params;
  const stream = await getStream(id);
  if (!stream) notFound();

  const [category, sameCategory] = await Promise.all([
    getCategory(stream.category),
    getStreams({ category: stream.category, limit: 5 }),
  ]);
  const related = sameCategory.filter((s) => s.id !== stream.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {/* Player placeholder */}
          <div className={`relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br ${stream.gradient}`}>
            <span className="absolute inset-0 grid animate-pulse place-items-center text-8xl">
              {category?.emoji ?? "🐶"}
            </span>
            <span className="absolute left-4 top-4 rounded bg-red-600 px-2 py-1 text-xs font-bold uppercase">Live</span>
          </div>

          <div className="mt-4 flex flex-wrap items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-zinc-800 text-lg font-bold text-amber-400 ring-2 ring-red-600">
              {stream.streamer[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold">{stream.streamer}</h1>
              <p className="text-zinc-300">{stream.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {category && (
                  <Link href={`/browse?category=${category.slug}`} className="text-amber-400 hover:underline">
                    {category.name}
                  </Link>
                )}
                {stream.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-400">● {formatViewers(stream.viewers)}</span>
              <button className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300">
                Follow
              </button>
            </div>
          </div>
        </div>

        <Chat streamer={stream.streamer} />
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">More {category?.name} streams</h2>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((s) => (
              <StreamCard key={s.id} stream={s} category={category ?? undefined} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
