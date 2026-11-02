import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "size-9 text-sm",
  md: "size-10 text-base",
  lg: "size-12 text-lg",
};

/** Initial-letter avatar. `live` adds a red ring. */
export function PsAvatar({ name, size = "sm", live = false }: { name: string; size?: Size; live?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-zinc-800 font-bold text-amber-400",
        sizes[size],
        live && "ring-2 ring-red-600",
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
