import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "size-8 text-sm",
  md: "size-10 text-base",
  lg: "size-12 text-lg",
  xl: "size-16 text-2xl",
};

/**
 * Round avatar: the photo at `src`, or the name's first letter. Decorative (the name is shown
 * next to it), so it's hidden from screen readers. `live` adds a red ring.
 */
export function PsAvatar({ name, src, size = "sm", live = false }: { name: string; src?: string; size?: Size; live?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-gray-800 font-bold text-brand-400",
        sizes[size],
        live && "ring-2 ring-danger-600",
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars are private, auth-protected images the optimizer can't fetch
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
