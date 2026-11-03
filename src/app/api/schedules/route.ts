import { getCurrentUser } from "@/features/account/auth/dal";
import { GROUP_PARAM } from "@/features/organization/groups/constants";
import { calendarAccess } from "@/features/scheduling/schedules/access";
import { SCHEDULE_RANGE_MAX_DAYS } from "@/features/scheduling/schedules/constants";
import { listSchedules } from "@/features/scheduling/schedules/queries";

// GET /api/schedules?from=<ISO>&to=<ISO>[&group=<id>]: a group calendar's schedules in that range
// (the calendar changes weeks in the browser, without a page request). Profile Managers and
// Callers get their own group's; super-admins pass `group` to view any group's.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const access = calendarAccess(user, params.get(GROUP_PARAM));
  if (access.mode === "none" || !access.groupId) return Response.json({ error: "No calendar" }, { status: 403 });

  const from = new Date(params.get("from") ?? "");
  const to = new Date(params.get("to") ?? "");
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (Number.isNaN(days) || days <= 0 || days > SCHEDULE_RANGE_MAX_DAYS) {
    return Response.json({ error: "Invalid range" }, { status: 400 });
  }

  const schedules = await listSchedules(access.groupId, from, to);
  return Response.json({ schedules }, { headers: { "Cache-Control": "private, no-store" } });
}
