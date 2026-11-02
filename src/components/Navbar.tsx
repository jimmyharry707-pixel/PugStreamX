import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="text-2xl">🐶</span>
          <span>
            PugStream<span className="text-amber-400">X</span>
          </span>
        </Link>
        <div className="hidden gap-5 text-sm text-zinc-300 sm:flex">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/browse" className="hover:text-white">Browse</Link>
        </div>
        <form action="/browse" className="ml-auto hidden max-w-sm flex-1 md:block">
          <input
            name="q"
            placeholder="Search streams…"
            className="w-full rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-400"
          />
        </form>
        <button className="ml-auto rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300 md:ml-0">
          Go Live
        </button>
      </nav>
    </header>
  );
}
