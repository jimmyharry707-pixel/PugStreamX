import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Card shell shared by the sign-in, sign-up and complete-profile pages. `wide` fits longer forms. */
export function PsAuthCard({
  title,
  description,
  footer,
  wide = false,
  children,
}: {
  title: string;
  description?: string;
  footer?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("w-full", wide ? "max-w-xl" : "max-w-sm")}>
      <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {/* A div, not a p: footers may hold forms (e.g. the sign-out button). */}
      {footer && <div className="mt-6 text-center text-sm text-zinc-400">{footer}</div>}
    </div>
  );
}
