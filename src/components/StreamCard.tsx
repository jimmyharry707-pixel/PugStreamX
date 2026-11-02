import Link from "next/link";
import { formatViewers, getCategory, type Stream } from "@/lib/streams";

export default function StreamCard({ stream }: { stream: Stream }) {
  const category = getCategory(stream.category);

  return (
    <Link href={`/watch/${stream.id}`} className="group block">
      <div
        className={`relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br ${stream.gradient} transition group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-amber-400/20`}
      >
        <span className="absolute inset-0 grid place-items-center text-5xl opacity-80 transition group-hover:scale-110">
          {category?.emoji ?? "🐶"}
        </span>
        {stream.live && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold uppercase">
            Live
          </span>
        )}
        <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-xs">
          {formatViewers(stream.viewers)} viewers
        </span>
      </div>
      <div className="mt-3 flex gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-800 text-sm font-bold text-amber-400">
          {stream.streamer[0]}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold group-hover:text-amber-400">{stream.title}</h3>
          <p className="truncate text-sm text-zinc-400">{stream.streamer}</p>
          <p className="truncate text-xs text-zinc-500">{category?.name}</p>
        </div>
      </div>
    </Link>
  );
}
