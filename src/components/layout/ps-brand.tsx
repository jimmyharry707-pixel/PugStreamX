import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** The PugStreamX logo, linking to `href`. */
export function PsBrand({ href = "/", size = "md", className }: { href?: string; size?: "md" | "lg"; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 font-bold tracking-tight", size === "lg" ? "text-2xl" : "text-lg", className)}
    >
      <span aria-hidden>🐶</span>
      <span>
        PugStream<span className="text-brand-400">X</span>
      </span>
    </Link>
  );
}
