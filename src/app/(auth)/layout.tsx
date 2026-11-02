import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/signin" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <span aria-hidden>🐶</span>
        <span>
          PugStream<span className="text-amber-400">X</span>
        </span>
      </Link>
      {children}
    </div>
  );
}
