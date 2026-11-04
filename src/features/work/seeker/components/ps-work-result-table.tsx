import { PsAvatar } from "@/components/ui/ps-avatar";
import { PsTable, PsTableBody, PsTableCell, PsTableHead, PsTableHeaderCell, PsTableRow, PsTableRowLink } from "@/components/ui/ps-table";
import { formatBytes } from "../constants";
import type { WorkResult } from "../types";
import { PsWorkResultTime } from "./ps-work-result-time";

/**
 * Work results, newest first: when, and the bid count. A row opens its files (`detailsHref`).
 * `showSeeker` adds who uploaded it (the Profile Manager's group view).
 */
export function PsWorkResultTable({ results, detailsHref, showSeeker = false }: { results: WorkResult[]; detailsHref: (id: string) => string; showSeeker?: boolean }) {
  return (
    <PsTable label="Work results" stack>
      <PsTableHead>
        <PsTableRow>
          {showSeeker && <PsTableHeaderCell>Job seeker</PsTableHeaderCell>}
          <PsTableHeaderCell>Uploaded</PsTableHeaderCell>
          <PsTableHeaderCell>Bids</PsTableHeaderCell>
          <PsTableHeaderCell hideBelow="md">Files</PsTableHeaderCell>
        </PsTableRow>
      </PsTableHead>
      <PsTableBody>
        {results.map((result) => {
          const time = (
            <PsTableRowLink href={detailsHref(result.id)} scroll={false}>
              <PsWorkResultTime at={result.createdAt} />
            </PsTableRowLink>
          );
          return (
            <PsTableRow key={result.id} data-work-result-id={result.id} interactive>
              {showSeeker && (
                <PsTableCell stack="full">
                  <div className="flex min-w-0 items-center gap-3">
                    <PsAvatar name={result.seeker?.fullName ?? "?"} src={result.seeker?.avatarUrl ?? undefined} />
                    <p className="truncate font-medium text-gray-100">{result.seeker?.fullName ?? "Former member"}</p>
                  </div>
                </PsTableCell>
              )}
              <PsTableCell stack="fill" className="text-gray-200">
                {time}
              </PsTableCell>
              <PsTableCell stack="auto" className="whitespace-nowrap">
                <span data-bid-count className="text-lg font-semibold tabular-nums text-gray-100">
                  {result.bidCount}
                </span>{" "}
                <span className="text-xs text-gray-400">{result.bidCount === 1 ? "bid" : "bids"}</span>
              </PsTableCell>
              <PsTableCell hideBelow="md" grow className="text-gray-400">
                {result.files
                  .slice(0, 3)
                  .map((f) => f.name)
                  .join(", ")}
                {result.files.length > 3 && ` +${result.files.length - 3} more`}
                <span className="ml-2 text-xs text-gray-500">({formatBytes(result.files.reduce((n, f) => n + f.size, 0))})</span>
              </PsTableCell>
            </PsTableRow>
          );
        })}
      </PsTableBody>
    </PsTable>
  );
}
