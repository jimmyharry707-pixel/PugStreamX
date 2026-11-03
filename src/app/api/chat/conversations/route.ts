import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/features/account/auth/dal";
import { listConversations } from "@/features/communication/chat/queries";

// GET /api/chat/conversations: the signed-in member's conversations, most recent first, with
// unread counts (the chat page's list and the left-panel badge).
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const conversations = await listConversations(new ObjectId(user.id));
  return Response.json({ conversations }, { headers: { "Cache-Control": "private, no-store" } });
}
