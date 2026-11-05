import { PsBadge } from "@/components/ui/ps-badge";
import { PsPagination } from "@/components/ui/ps-pagination";
import type { Page } from "@/lib/utils/pagination";
import { ACTIVITY_KIND_LABELS, type ActivityKind } from "../constants";
import type { Activity } from "../types";
import { PsActivityTime } from "./ps-activity-time";

const KIND_BADGE: Record<ActivityKind, "tag" | "info" | "success" | "warning" | "danger"> = {
  account: "tag",
  schedule: "info",
  chat: "tag",
  invoice: "warning",
  work: "success",
  admin: "danger",
};

/**
 * A member's recent activity, newest first: what they did, its kind and when, with page links.
 * `href` is the list's URL without its page; `pageParam` names the page's search param.
 */
export function PsActivityList({
  items,
  page,
  href,
  pageParam,
  empty = "No activity yet.",
}: {
  items: Activity[];
  page: Page;
  href: string;
  pageParam?: string;
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-gray-400">{empty}</p>;
  }
  return (
    <div className="space-y-4">
      <ol className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-gray-900" aria-label="Activity">
        {items.map((a) => (
          <li key={a.id} data-activity={a.kind} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm sm:flex-nowrap">
            <PsBadge variant={KIND_BADGE[a.kind]} className="shrink-0">
              {ACTIVITY_KIND_LABELS[a.kind]}
            </PsBadge>
            <p className="min-w-0 flex-1 break-words text-gray-200 max-sm:basis-full max-sm:order-last">{a.text}</p>
            <span className="shrink-0 text-xs text-gray-500">
              <PsActivityTime at={a.createdAt} />
            </span>
          </li>
        ))}
      </ol>
      <PsPagination {...page} href={href} param={pageParam} label="Activity pages" />
    </div>
  );
}
