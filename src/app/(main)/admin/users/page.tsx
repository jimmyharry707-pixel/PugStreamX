import { ObjectId } from "mongodb";
import type { Metadata } from "next";
import { PsChip } from "@/components/ui/ps-chip";
import { PsModal } from "@/components/ui/ps-modal";
import { PsPagination } from "@/components/ui/ps-pagination";
import { PsActivityList } from "@/features/account/activity/components/ps-activity-list";
import { ACTIVITY_PAGE_PARAM, ACTIVITY_PARAM } from "@/features/account/activity/constants";
import { listActivitiesPage } from "@/features/account/activity/queries";
import { PsUserProfile } from "@/features/organization/admin/components/ps-user-profile";
import { PsUserTable } from "@/features/organization/admin/components/ps-user-table";
import { ADMIN_USERS_PATH, USER_PARAM, USER_STATUS_FILTERS, type UserStatusFilter } from "@/features/organization/admin/constants";
import { requireSuperAdmin } from "@/features/account/auth/dal";
import { listGroups } from "@/features/organization/groups/queries";
import { getUserDetails, listUsersPage } from "@/features/account/users/queries";
import { parsePage } from "@/lib/utils/pagination";

export const metadata: Metadata = { title: "Users · Admin" };

const FILTER_LABELS: Record<UserStatusFilter, string> = { all: "All", inactive: "Inactive", active: "Active" };

/** Users page URL, keeping the status filter (and page), and optionally opening one user's profile or activity. */
function usersHref(filter: UserStatusFilter, { page, userId, activityOf }: { page?: number; userId?: string; activityOf?: string } = {}) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (page && page > 1) params.set("page", String(page));
  if (userId) params.set(USER_PARAM, userId);
  if (activityOf) params.set(ACTIVITY_PARAM, activityOf);
  const query = params.toString();
  return query ? `${ADMIN_USERS_PATH}?${query}` : ADMIN_USERS_PATH;
}

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const admin = await requireSuperAdmin();
  const params = await searchParams;
  const filter = USER_STATUS_FILTERS.find((f) => f === params.status) ?? "all";
  const idParam = (name: string) => {
    const value = params[name];
    return typeof value === "string" && ObjectId.isValid(value) ? value : null;
  };
  const selectedId = idParam(USER_PARAM);
  // Show activity: `?activity=<id>`, with its own page (`?activityPage=N`) so the list keeps `?page`.
  const activityId = selectedId ? null : idParam(ACTIVITY_PARAM);

  const [{ items: shown, page, counts }, selected, groups, activityUser, activity] = await Promise.all([
    listUsersPage(filter, parsePage(params.page)),
    selectedId ? getUserDetails(new ObjectId(selectedId)) : null,
    listGroups(),
    activityId ? getUserDetails(new ObjectId(activityId)) : null,
    activityId ? listActivitiesPage(new ObjectId(activityId), parsePage(params[ACTIVITY_PAGE_PARAM])) : null,
  ]);
  const groupNames = Object.fromEntries(groups.map((g) => [g.id, g.name]));
  // Inactive accounts (waiting for activation) come first.
  const listHref = usersHref(filter, { page: page.page });

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-gray-400">
        Every account on PugStreamX. New accounts can&apos;t sign in until you activate them. Click a row to see the full
        profile and change the role.
      </p>

      <nav aria-label="Filter accounts" className="mt-6 flex flex-wrap gap-2">
        {USER_STATUS_FILTERS.map((f) => (
          <PsChip key={f} href={usersHref(f)} active={f === filter} className="text-xs">
            {FILTER_LABELS[f]} · {counts[f]}
          </PsChip>
        ))}
      </nav>

      <div className="mt-4 space-y-4">
        {shown.length > 0 ? (
          <>
            <PsUserTable users={shown} currentUserId={admin.id} profileHref={(id) => usersHref(filter, { page: page.page, userId: id })}
              activityHref={(id) => usersHref(filter, { page: page.page, activityOf: id })} groupNames={groupNames} />
            <PsPagination {...page} href={usersHref(filter)} label="User pages" />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-gray-400">
            {filter === "inactive" ? "No accounts are waiting for activation." : "No accounts here yet."}
          </p>
        )}
      </div>

      {selected && (
        <PsModal title="User profile" closeHref={listHref}>
          <PsUserProfile user={selected} isSelf={selected.id === admin.id} groups={groups} />
        </PsModal>
      )}

      {activityUser && activity && (
        <PsModal title={`Activity · ${activityUser.profile?.displayName ?? activityUser.email}`} closeHref={listHref}>
          <PsActivityList
            items={activity.items}
            page={activity.page}
            href={usersHref(filter, { page: page.page, activityOf: activityUser.id })}
            pageParam={ACTIVITY_PAGE_PARAM}
            empty="No activity yet."
          />
        </PsModal>
      )}
    </div>
  );
}
