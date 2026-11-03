import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/features/auth/dal";
import { SCHEDULE_RANGE_MAX_DAYS } from "@/features/schedules/constants";
import { listSchedules } from "@/features/schedules/queries";

// GET /api/schedules?from=<ISO>&to=<ISO>: the signed-in member's own schedules in that range,
// for the calendar (which changes weeks in the browser, without a page request).
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const from = new Date(params.get("from") ?? "");
  const to = new Date(params.get("to") ?? "");
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (Number.isNaN(days) || days <= 0 || days > SCHEDULE_RANGE_MAX_DAYS) {
    return Response.json({ error: "Invalid range" }, { status: 400 });
  }

  const schedules = await listSchedules(new ObjectId(user.id), from, to);
  return Response.json({ schedules }, { headers: { "Cache-Control": "private, no-store" } });
}
