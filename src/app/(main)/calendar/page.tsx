import type { Metadata } from "next";
import { PsLinkButton } from "@/components/ui/ps-button";
import { PsEmptyState } from "@/components/ui/ps-empty-state";
import { ADMIN_GROUPS_PATH } from "@/features/organization/admin/constants";
import { requireCompleteProfile } from "@/features/account/auth/dal";
import { PsCalendar } from "@/features/scheduling/calendar/components/ps-calendar";
import { listGroups } from "@/features/organization/groups/queries";
import { calendarAccess } from "@/features/scheduling/schedules/access";

export const metadata: Metadata = { title: "Schedule" };

export default async function CalendarPage() {
  const user = await requireCompleteProfile();
  const access = calendarAccess(user);

  if (access.mode === "none") {
    return (
      <PsEmptyState emoji="🗓️" title="No calendar yet">
        {access.reason === "group"
          ? "You're not in a group yet. An administrator needs to add you to one; then you'll see its calendar here."
          : "The calendar is for Profile Managers and Callers. Ask an administrator to give you a role and a group."}
      </PsEmptyState>
    );
  }

  if (access.mode === "view") {
    const groups = await listGroups();
    if (groups.length === 0) {
      return (
        <PsEmptyState
          emoji="🗓️"
          title="No groups yet"
          action={<PsLinkButton href={ADMIN_GROUPS_PATH}>Create a group</PsLinkButton>}
        >
          Each group has its own calendar. Create a group, then add Profile Managers and Callers to it.
        </PsEmptyState>
      );
    }
    return <PsCalendar mode="view" groups={groups} />;
  }

  return <PsCalendar mode={access.mode} />;
}
