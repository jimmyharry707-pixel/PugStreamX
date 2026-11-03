import { getCurrentUser } from "@/features/account/auth/dal";
import { GROUP_PARAM } from "@/features/organization/groups/constants";
import { calendarAccess } from "@/features/scheduling/schedules/access";
import { SCHEDULE_UID_PATTERN } from "@/features/scheduling/schedules/constants";
import { findScheduleByUid } from "@/features/scheduling/schedules/queries";

// GET /api/schedules/:uid[?group=<id>]: one schedule by its ID from the viewer's group calendar
// (e.g. to open a linked schedule from another week). Other groups' schedules are a 404.
export async function GET(request: Request, { params }: RouteContext<"/api/schedules/[uid]">) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const access = calendarAccess(user, new URL(request.url).searchParams.get(GROUP_PARAM));
  if (access.mode === "none" || !access.groupId) return Response.json({ error: "No calendar" }, { status: 403 });

  const { uid } = await params;
  if (!SCHEDULE_UID_PATTERN.test(uid)) return Response.json({ error: "Not found" }, { status: 404 });
  const schedule = await findScheduleByUid(access.groupId, uid);
  if (!schedule) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ schedule }, { headers: { "Cache-Control": "private, no-store" } });
}
