import { ObjectId } from "mongodb";
import type { Metadata } from "next";
import { PsChip } from "@/components/ui/ps-chip";
import { PsModal } from "@/components/ui/ps-modal";
import { PsUserProfile } from "@/features/admin/components/ps-user-profile";
import { PsUserTable } from "@/features/admin/components/ps-user-table";
import { ADMIN_USERS_PATH, USER_PARAM, USER_STATUS_FILTERS, type UserStatusFilter } from "@/features/admin/constants";
import { requireSuperAdmin } from "@/features/auth/dal";
import { getUserDetails, listUsers } from "@/features/users/queries";

export const metadata: Metadata = { title: "Users · Admin" };

const FILTER_LABELS: Record<UserStatusFilter, string> = { all: "All", inactive: "Inactive", active: "Active" };

/** Users page URL, keeping the status filter and optionally opening one user's profile. */
function usersHref(filter: UserStatusFilter, userId?: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (userId) params.set(USER_PARAM, userId);
  const query = params.toString();
  return query ? `${ADMIN_USERS_PATH}?${query}` : ADMIN_USERS_PATH;
}

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const admin = await requireSuperAdmin();
  const params = await searchParams;
  const filter = USER_STATUS_FILTERS.find((f) => f === params.status) ?? "all";
  const selectedId = typeof params[USER_PARAM] === "string" && ObjectId.isValid(params[USER_PARAM]) ? params[USER_PARAM] : null;

  const [users, selected] = await Promise.all([
    listUsers(),
    selectedId ? getUserDetails(new ObjectId(selectedId)) : null,
  ]);
  const counts: Record<UserStatusFilter, number> = {
    all: users.length,
    inactive: users.filter((u) => !u.active).length,
    active: users.filter((u) => u.active).length,
  };
  // Inactive accounts (waiting for activation) come first.
  const shown = users
    .filter((u) => filter === "all" || u.active === (filter === "active"))
    .sort((a, b) => Number(a.active) - Number(b.active));

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-zinc-400">
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

      <div className="mt-4">
        {shown.length > 0 ? (
          <PsUserTable users={shown} currentUserId={admin.id} profileHref={(id) => usersHref(filter, id)} />
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-zinc-400">
            {filter === "inactive" ? "No accounts are waiting for activation." : "No accounts here yet."}
          </p>
        )}
      </div>

      {selected && (
        <PsModal title="User profile" closeHref={usersHref(filter)}>
          <PsUserProfile user={selected} isSelf={selected.id === admin.id} />
        </PsModal>
      )}
    </div>
  );
}
