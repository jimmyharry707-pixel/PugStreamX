import type { Metadata } from "next";
import { requireSuperAdmin } from "@/features/account/auth/dal";
import { PsGroupManager } from "@/features/organization/groups/components/ps-group-manager";
import { listGroupsWithCounts } from "@/features/organization/groups/queries";

export const metadata: Metadata = { title: "Groups · Admin" };

export default async function AdminGroupsPage() {
  await requireSuperAdmin();
  const groups = await listGroupsWithCounts();

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Groups</h1>
      <p className="mt-1 text-sm text-gray-400">
        Members of a group share one calendar: its Profile Managers make the schedules and its Callers see them. Put people
        in a group from Admin › Users.
      </p>
      <PsGroupManager groups={groups} />
    </div>
  );
}
