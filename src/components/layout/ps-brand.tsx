import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** The GoldHorizon logo, linking to `href`. */
export function PsBrand({ href = "/", size = "md", className }: { href?: string; size?: "md" | "lg"; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 font-bold tracking-tight", size === "lg" ? "text-2xl" : "text-lg", className)}
    >
      <span aria-hidden>🌅</span>
      <span>
        <span className="text-brand-400">Gold</span>Horizon
      </span>
    </Link>
  );
}
