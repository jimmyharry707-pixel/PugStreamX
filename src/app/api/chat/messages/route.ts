import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/features/account/auth/dal";
import { WITH_PARAM } from "@/features/communication/chat/constants";
import { findChatMember, listMessages } from "@/features/communication/chat/queries";
import { allowsFreeText } from "@/features/communication/chat/templates";

// GET /api/chat/messages?with=<userId>[&before=<ISO>]: a page of the signed-in member's
// conversation with that member (the newest, or those before `before`), whether the viewer can
// write to them (`canSend`), and whether freely (`freeText`: only with a founder in it) or by
// picking one of the allowed messages.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const withId = params.get(WITH_PARAM) ?? "";
  const beforeParam = params.get("before");
  const before = beforeParam ? new Date(beforeParam) : undefined;
  if (!ObjectId.isValid(withId) || withId.length !== 24 || (before && Number.isNaN(before.getTime()))) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const me = new ObjectId(user.id);
  const other = new ObjectId(withId);
  const [member, page] = await Promise.all([findChatMember(user, other), listMessages(me, other, before)]);
  // A member who can't be messaged (any more): deactivated, or not in the viewer's group. Their history stays readable.
  if (!member && page.messages.length === 0) return Response.json({ error: "Not found" }, { status: 404 });
  const freeText = !!member && allowsFreeText(user.isSuperAdmin, member.isFounder);
  return Response.json({ ...page, canSend: !!member, freeText }, { headers: { "Cache-Control": "private, no-store" } });
}
