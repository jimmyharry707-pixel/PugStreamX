import type { ReactNode } from "react";

/** Page section with a heading and an optional action (e.g. a "Show all" link) on the right. */
export function PsSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
