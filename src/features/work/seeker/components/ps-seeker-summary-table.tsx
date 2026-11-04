import { PsAvatar } from "@/components/ui/ps-avatar";
import { PsTable, PsTableBody, PsTableCell, PsTableHead, PsTableHeaderCell, PsTableRow, PsTableRowLink } from "@/components/ui/ps-table";
import type { SeekerSummary } from "../types";
import { PsWorkResultTime } from "./ps-work-result-time";

/**
 * Job seekers with their bids, uploads and last upload. A row picks that job seeker
 * (`selectHref`); `selected` (a display name) is highlighted. `showGroup` adds their group
 * (the founder's view).
 */
export function PsSeekerSummaryTable({
  seekers,
  selectHref,
  selected,
  showGroup = false,
}: {
  seekers: SeekerSummary[];
  selectHref: (displayName: string) => string;
  selected: string | null;
  showGroup?: boolean;
}) {
  return (
    <PsTable label="Job seekers" stack>
      <PsTableHead>
        <PsTableRow>
          <PsTableHeaderCell>Job seeker</PsTableHeaderCell>
          {showGroup && <PsTableHeaderCell hideBelow="md">Group</PsTableHeaderCell>}
          <PsTableHeaderCell>Bids</PsTableHeaderCell>
          <PsTableHeaderCell hideBelow="md">Work results</PsTableHeaderCell>
          <PsTableHeaderCell hideBelow="lg">Last upload</PsTableHeaderCell>
        </PsTableRow>
      </PsTableHead>
      <PsTableBody>
        {seekers.map((s) => {
          const isSelected = selected?.toLowerCase() === s.displayName.toLowerCase();
          return (
            <PsTableRow key={s.displayName} data-seeker-row data-selected={isSelected || undefined} interactive className={isSelected ? "bg-brand-400/10" : undefined}>
              <PsTableCell grow stack="fill">
                <div className="flex min-w-0 items-center gap-3">
                  <PsAvatar name={s.fullName} src={s.avatarUrl ?? undefined} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-100">
                      <PsTableRowLink href={selectHref(s.displayName)} scroll={false} aria-current={isSelected || undefined}>
                        {s.fullName}
                      </PsTableRowLink>
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      @{s.displayName}
                      {showGroup && <span className="md:hidden"> · {s.groupName ?? "No group"}</span>}
                    </p>
                  </div>
                </div>
              </PsTableCell>
              {showGroup && (
                <PsTableCell hideBelow="md" className="max-w-48 truncate whitespace-nowrap text-gray-300">
                  {s.groupName ?? <span className="text-gray-500">No group</span>}
                </PsTableCell>
              )}
              <PsTableCell stack="auto" className="whitespace-nowrap">
                <span data-bid-count className="text-lg font-semibold tabular-nums text-gray-100">
                  {s.bids}
                </span>{" "}
                <span className="text-xs text-gray-400">{s.bids === 1 ? "bid" : "bids"}</span>
              </PsTableCell>
              <PsTableCell hideBelow="md" className="tabular-nums text-gray-300">
                {s.results}
              </PsTableCell>
              <PsTableCell hideBelow="lg" className="text-gray-400">
                {s.lastAt ? <PsWorkResultTime at={s.lastAt} /> : "—"}
              </PsTableCell>
            </PsTableRow>
          );
        })}
      </PsTableBody>
    </PsTable>
  );
}
