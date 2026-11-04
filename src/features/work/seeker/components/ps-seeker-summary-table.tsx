import { PsAvatar } from "@/components/ui/ps-avatar";
import { PsTable, PsTableBody, PsTableCell, PsTableHead, PsTableHeaderCell, PsTableRow } from "@/components/ui/ps-table";
import type { SeekerSummary } from "../types";
import { PsWorkResultTime } from "./ps-work-result-time";

/** The job seekers in a Profile Manager's group, with their bids, uploads and last upload. */
export function PsSeekerSummaryTable({ seekers }: { seekers: SeekerSummary[] }) {
  return (
    <PsTable label="Job seekers" stack>
      <PsTableHead>
        <PsTableRow>
          <PsTableHeaderCell>Job seeker</PsTableHeaderCell>
          <PsTableHeaderCell>Bids</PsTableHeaderCell>
          <PsTableHeaderCell hideBelow="md">Work results</PsTableHeaderCell>
          <PsTableHeaderCell hideBelow="md">Last upload</PsTableHeaderCell>
        </PsTableRow>
      </PsTableHead>
      <PsTableBody>
        {seekers.map((s) => (
          <PsTableRow key={s.displayName} data-seeker-row>
            <PsTableCell grow stack="fill">
              <div className="flex min-w-0 items-center gap-3">
                <PsAvatar name={s.fullName} src={s.avatarUrl ?? undefined} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-100">{s.fullName}</p>
                  <p className="truncate text-xs text-gray-400">@{s.displayName}</p>
                </div>
              </div>
            </PsTableCell>
            <PsTableCell stack="auto" className="whitespace-nowrap">
              <span data-bid-count className="text-lg font-semibold tabular-nums text-gray-100">
                {s.bids}
              </span>{" "}
              <span className="text-xs text-gray-400">{s.bids === 1 ? "bid" : "bids"}</span>
            </PsTableCell>
            <PsTableCell hideBelow="md" className="tabular-nums text-gray-300">
              {s.results}
            </PsTableCell>
            <PsTableCell hideBelow="md" className="text-gray-400">
              {s.lastAt ? <PsWorkResultTime at={s.lastAt} /> : "—"}
            </PsTableCell>
          </PsTableRow>
        ))}
      </PsTableBody>
    </PsTable>
  );
}
