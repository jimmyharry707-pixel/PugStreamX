import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/** Centered, max-width page wrapper with side gutters. */
export function PsContainer({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4", className)} {...props} />;
}
