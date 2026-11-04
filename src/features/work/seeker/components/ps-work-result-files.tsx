import { PsAvatar } from "@/components/ui/ps-avatar";
import { formatBytes, workFileUrl } from "../constants";
import type { WorkResult } from "../types";
import { PsWorkResultTime } from "./ps-work-result-time";

/**
 * One work result's details (the dialog behind a list row): bid count, when, who (on the
 * Profile Manager's view) and its files. Each file opens in a new tab, shown as a page (not
 * downloaded) in a sandbox without scripts.
 */
export function PsWorkResultFiles({ result }: { result: WorkResult }) {
  return (
    <div className="space-y-4">
      {result.seeker && (
        <div className="flex min-w-0 items-center gap-3" data-seeker>
          <PsAvatar name={result.seeker.fullName} src={result.seeker.avatarUrl ?? undefined} />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-100">{result.seeker.fullName}</p>
            <p className="truncate text-xs text-gray-400">@{result.seeker.displayName}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-3xl font-bold tabular-nums">
          {result.bidCount} <span className="text-base font-medium text-gray-400">{result.bidCount === 1 ? "bid" : "bids"}</span>
        </p>
        <p className="text-sm text-gray-400">
          <PsWorkResultTime at={result.createdAt} />
        </p>
      </div>
      <ul className="divide-y divide-white/5 rounded-2xl border border-white/10" data-work-files>
        {result.files.map((f, i) => (
          <li key={i}>
            <a
              href={workFileUrl(result.id, i)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${f.name}`}
              className="flex items-center gap-3 px-4 py-2 text-sm transition hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
            >
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-gray-500">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-brand-300 underline-offset-2 hover:underline">{f.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-gray-500">{formatBytes(f.size)}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-gray-500" aria-hidden>
                <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500">Pages open in a new tab, as saved, with their scripts turned off.</p>
    </div>
  );
}
