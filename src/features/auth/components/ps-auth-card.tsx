import type { ReactNode } from "react";

/** Card shell shared by the sign-in and sign-up pages. */
export function PsAuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <p className="mt-6 text-center text-sm text-zinc-400">{footer}</p>}
    </div>
  );
}
