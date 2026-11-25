import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline";

const sizes: Record<Size, string> = {
  sm: "size-8 text-sm",
  md: "size-10 text-base",
  lg: "size-12 text-lg",
  xl: "size-16 text-2xl",
};

const dotSizes: Record<Size, string> = {
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
  xl: "size-4",
};

/**
 * Round avatar: the photo at `src`, or the name's first letter. Decorative (the name is shown
 * next to it), so it's hidden from screen readers. `live` adds a red ring.
 *
 * `status` adds a dot at the bottom right: green "online", grey "offline". The dot is decorative
 * too, so say the status in text next to it (e.g. "Online", or `sr-only`).
 */
export function PsAvatar({
  name,
  src,
  size = "sm",
  live = false,
  status,
}: {
  name: string;
  src?: string;
  size?: Size;
  live?: boolean;
  status?: AvatarStatus;
}) {
  const avatar = (
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
  if (!status) return avatar;
  return (
    <span aria-hidden className="relative inline-flex shrink-0" data-avatar-status={status}>
      {avatar}
      <span
        className={cn(
          "absolute bottom-0 right-0 rounded-full ring-2 ring-gray-950",
          dotSizes[size],
          status === "online" ? "bg-success-400" : "bg-gray-500",
        )}
      />
    </span>
  );
}
