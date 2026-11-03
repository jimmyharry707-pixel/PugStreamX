import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/features/auth/dal";
import { SCHEDULE_UID_PATTERN } from "@/features/schedules/constants";
import { findScheduleByUid } from "@/features/schedules/queries";

// GET /api/schedules/:uid: one of the signed-in member's own schedules by its ID (e.g. to open a
// linked schedule from another week). Other members' schedules are a 404, like missing ones.
export async function GET(_request: Request, { params }: RouteContext<"/api/schedules/[uid]">) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { uid } = await params;
  if (!SCHEDULE_UID_PATTERN.test(uid)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const schedule = await findScheduleByUid(new ObjectId(user.id), uid);
  if (!schedule) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ schedule }, { headers: { "Cache-Control": "private, no-store" } });
}
