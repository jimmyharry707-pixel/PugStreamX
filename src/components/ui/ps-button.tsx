import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
type StyleProps = { variant?: Variant; size?: Size };

const variants: Record<Variant, string> = {
  primary: "bg-amber-400 font-semibold text-zinc-950 hover:bg-amber-300",
  secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
  ghost: "text-zinc-300 hover:text-white",
  danger: "bg-red-600 font-semibold text-white hover:bg-red-500",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3",
};

function psButtonClasses({ variant = "primary", size = "md" }: StyleProps, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-full transition disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function PsButton({ variant, size, className, ...props }: ComponentProps<"button"> & StyleProps) {
  return <button className={psButtonClasses({ variant, size }, className)} {...props} />;
}

/** A Next.js link styled as a button. */
export function PsLinkButton({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={psButtonClasses({ variant, size }, className)} {...props} />;
}
