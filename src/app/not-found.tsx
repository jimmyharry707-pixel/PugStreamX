import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-7xl">🐶❓</p>
      <h1 className="mt-6 text-3xl font-bold">This stream wandered off</h1>
      <p className="mt-2 text-zinc-400">We couldn&apos;t find that page. It&apos;s probably chasing its tail somewhere.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-amber-400 px-6 py-3 font-semibold text-zinc-950 hover:bg-amber-300">
        Back home
      </Link>
    </div>
  );
}
