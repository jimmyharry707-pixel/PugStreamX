import type { ReactNode } from "react";

export function PsEmptyState({
  emoji,
  title,
  children,
  action,
}: {
  emoji: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl">{emoji}</p>
      <h1 className="mt-6 text-2xl font-bold">{title}</h1>
      {children && <div className="mt-2 text-zinc-400">{children}</div>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
