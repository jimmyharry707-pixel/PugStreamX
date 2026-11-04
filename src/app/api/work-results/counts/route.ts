import { getCurrentUser } from "@/features/account/auth/dal";
import { GROUP_FILTER_PARAM, SEEKER_PARAM } from "@/features/work/seeker/constants";
import { BID_PERIODS, PERIOD_OFFSET_MAX, periodRanges, type BidPeriod } from "@/features/work/seeker/periods";
import { countBidsByPeriod, seekerIdsIn } from "@/features/work/seeker/queries";
import type { BidCountsResponse } from "@/features/work/seeker/types";
import { resolveSeekerView } from "@/features/work/seeker/view";
import { isValidTimeZone, zonedTime } from "@/lib/utils/time-zone";

// GET /api/work-results/counts?period=day|week|month&zone=<IANA>&offset=<n>[&group][&seeker]:
// bids per day, week or month (in the viewer's time zone, which only the browser knows), for the
// same job seekers the Seeker page shows the viewer. `offset` moves back whole screens.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const view = await resolveSeekerView(user, { group: params.get(GROUP_FILTER_PARAM), seeker: params.get(SEEKER_PARAM) });
  if (!view) return Response.json({ error: "No Seeker view" }, { status: 403 });

  const period = BID_PERIODS.find((p) => p === params.get("period"));
  const zone = params.get("zone") ?? "";
  const offset = Number(params.get("offset") ?? 0);
  if (!period || !isValidTimeZone(zone) || !Number.isInteger(offset) || offset < 0 || offset > PERIOD_OFFSET_MAX) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const userIds = view.mode === "upload" ? [view.userId] : await seekerIdsIn(view.scope, view.seeker);
  const ranges = periodRanges(period as BidPeriod, zonedTime(new Date(), zone).day, offset);
  const { counts, hasEarlier } = await countBidsByPeriod(userIds, ranges, zone);
  const body: BidCountsResponse = { periods: counts.reverse(), hasEarlier: hasEarlier && offset < PERIOD_OFFSET_MAX };
  return Response.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
