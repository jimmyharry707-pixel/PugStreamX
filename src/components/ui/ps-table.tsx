import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import "@/static/css/components/ps-table.css";

type Breakpoint = "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end";

// Literal class names so Tailwind generates them.
const HIDE_BELOW: Record<Breakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};
const ALIGN: Record<Align, string> = { start: "text-left", center: "text-center", end: "text-right" };

/**
 * Data table in a rounded card. Build it from the parts in this file:
 *
 *   <PsTable label="Users" stack>
 *     <PsTableHead>
 *       <PsTableRow>
 *         <PsTableHeaderCell>Name</PsTableHeaderCell>
 *         <PsTableHeaderCell hideBelow="md">Role</PsTableHeaderCell>
 *       </PsTableRow>
 *     </PsTableHead>
 *     <PsTableBody>
 *       <PsTableRow interactive>
 *         <PsTableCell grow stack="full"><PsTableRowLink href="...">Jane</PsTableRowLink></PsTableCell>
 *         <PsTableCell hideBelow="md">Founder</PsTableCell>
 *       </PsTableRow>
 *     </PsTableBody>
 *   </PsTable>
 *
 * `stack` turns every row into a small card on phones (below `sm`): no header, and cells
 * wrap onto lines as their `stack` prop says. Without it, a table that's too wide scrolls
 * sideways inside its card, never the page.
 */
export function PsTable({
  label,
  stack = false,
  className,
  children,
}: {
  /** Accessible name, e.g. "Users". */
  label: string;
  stack?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-white/10 bg-gray-900", className)}>
      <table aria-label={label} className={cn("w-full text-left text-sm", stack && "ps-table--stack")}>
        {children}
      </table>
    </div>
  );
}

export function PsTableHead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">{children}</thead>;
}

export function PsTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
}

/**
 * A row. `interactive` adds a hover highlight and lets a PsTableRowLink inside it make the
 * whole row clickable.
 */
export function PsTableRow({ interactive = false, className, ...props }: ComponentProps<"tr"> & { interactive?: boolean }) {
  return <tr className={cn(interactive && "relative transition hover:bg-white/[0.03]", className)} {...props} />;
}

type CellOptions = {
  /** Hide this column on screens narrower than the breakpoint. */
  hideBelow?: Breakpoint;
  align?: Align;
};

/** Column heading. Use the same `hideBelow` as the column's cells. */
export function PsTableHeaderCell({ hideBelow, align = "start", className, ...props }: Omit<ComponentProps<"th">, "align"> & CellOptions) {
  return (
    <th
      scope="col"
      className={cn("ps-table__head-cell font-medium", ALIGN[align], hideBelow && HIDE_BELOW[hideBelow], className)}
      {...props}
    />
  );
}

export function PsTableCell({
  hideBelow,
  align = "start",
  grow = false,
  stack,
  aboveRowLink = false,
  className,
  ...props
}: Omit<ComponentProps<"td">, "align"> &
  CellOptions & {
    /** Take the leftover width and truncate long content (give the main column this). */
    grow?: boolean;
    /** In a stacked table on phones: own line, rest of the line, own width, or hidden. */
    stack?: "full" | "fill" | "auto" | "hide";
    /** Keep buttons and links in this cell clickable in a row with a PsTableRowLink. */
    aboveRowLink?: boolean;
  }) {
  return (
    <td
      data-stack={stack}
      className={cn(
        "ps-table__cell",
        ALIGN[align],
        grow && "ps-table__cell--grow",
        hideBelow && HIDE_BELOW[hideBelow],
        aboveRowLink && "relative z-10",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Link that makes its whole PsTableRow (with `interactive`) clickable, e.g. to open details.
 * Put it around the row's main text; give cells with their own buttons `aboveRowLink`.
 */
export function PsTableRowLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brand-400",
        className,
      )}
      {...props}
    />
  );
}
