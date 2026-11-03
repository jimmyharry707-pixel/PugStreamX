import "server-only";
import { ObjectId } from "mongodb";
import { avatarUrl } from "@/features/account/profile/constants";
import { ROLES, isSuperAdmin, roleLabel } from "@/features/account/users/roles";
import type { PublicUser, UserDoc } from "@/features/account/users/types";
import { listGroups } from "@/features/organization/groups/queries";
import { getCollection } from "@/lib/db/client";
import { MESSAGES_PAGE, UNREAD_MAX } from "./constants";
import type { ChatMember, ChatMessage, ConversationDoc, ConversationSummary, MessageDoc } from "./types";

// Chat reads are per user and never cached. Every read is filtered by the viewer's id, so
// members only ever see their own conversations.

/** The one conversation key for a pair of members, whichever way round. */
export function pairKey(a: ObjectId, b: ObjectId): string {
  return [a.toHexString(), b.toHexString()].sort().join(":");
}

export function toChatMessage(doc: MessageDoc, viewerId: ObjectId): ChatMessage {
  return { id: doc._id.toHexString(), mine: doc.senderId.equals(viewerId), text: doc.text, createdAt: doc.createdAt.toISOString() };
}

/**
 * Who the viewer can message: active members with a complete profile who are in the viewer's
 * group or are founders. Founders can message everyone (so they can always reply). A member
 * without a group can message only founders. It's symmetric: whoever can message you, you can
 * message back.
 */
function messageableBy(viewer: PublicUser) {
  const base = { active: true, "profile.completedAt": { $exists: true }, _id: { $ne: new ObjectId(viewer.id) } };
  if (viewer.isSuperAdmin) return base;
  const team = viewer.groupId ? [{ groupId: new ObjectId(viewer.groupId) }] : [];
  return { ...base, $or: [{ role: ROLES.founder }, ...team] };
}

/** What a member's row needs: their profile, role and group. */
const MEMBER_FIELDS = { profile: 1, role: 1, groupId: 1 } as const;

/** Group id → name, to label members with their group. */
async function groupNames(): Promise<Map<string, string>> {
  return new Map((await listGroups()).map((g) => [g.id, g.name]));
}

function toChatMember(user: UserDoc, groups: Map<string, string>): ChatMember {
  const p = user.profile!;
  const role = user.role ?? null;
  return {
    id: user._id.toHexString(),
    fullName: p.fullName,
    displayName: p.displayName,
    avatarUrl: avatarUrl(p.avatarId.toHexString()),
    role: roleLabel(role),
    isFounder: isSuperAdmin(role),
    groupName: (user.groupId && groups.get(user.groupId.toHexString())) ?? null,
  };
}

/** Everyone the viewer can message (their group and the founders), by name. */
export async function listChatMembers(viewer: PublicUser): Promise<ChatMember[]> {
  const users = await getCollection<UserDoc>("users");
  const docs = await users
    .find(messageableBy(viewer), { projection: MEMBER_FIELDS })
    .sort({ "profile.fullName": 1 })
    .toArray();
  const groups = await groupNames();
  return docs.map((doc) => toChatMember(doc, groups));
}

/**
 * One member the viewer can message, or null: themselves, inactive, no profile, no such user, or
 * outside the viewer's group (and not a founder).
 */
export async function findChatMember(viewer: PublicUser, memberId: ObjectId): Promise<ChatMember | null> {
  const users = await getCollection<UserDoc>("users");
  const doc = await users.findOne({ $and: [messageableBy(viewer), { _id: memberId }] }, { projection: MEMBER_FIELDS });
  return doc ? toChatMember(doc, await groupNames()) : null;
}

export async function findConversation(a: ObjectId, b: ObjectId): Promise<ConversationDoc | null> {
  const conversations = await getCollection<ConversationDoc>("conversations");
  return conversations.findOne({ key: pairKey(a, b) });
}

/** Messages from the other member after the viewer last read the conversation (at most UNREAD_MAX + 1). */
async function countUnread(conversation: ConversationDoc, viewerId: ObjectId): Promise<number> {
  const messages = await getCollection<MessageDoc>("messages");
  const readAt = conversation.readAt[viewerId.toHexString()] ?? new Date(0);
  return messages.countDocuments(
    { conversationId: conversation._id, senderId: { $ne: viewerId }, createdAt: { $gt: readAt } },
    { limit: UNREAD_MAX + 1 },
  );
}

/**
 * The viewer's conversations, most recent first, with unread counts. Conversations with members
 * who can no longer be messaged (deactivated, or moved to another group) are still listed, so
 * their history stays readable; they just can't get new messages.
 */
export async function listConversations(viewerId: ObjectId): Promise<ConversationSummary[]> {
  const conversations = await getCollection<ConversationDoc>("conversations");
  const docs = await conversations.find({ memberIds: viewerId }).sort({ lastMessageAt: -1 }).limit(200).toArray();
  const otherIds = docs.map((c) => c.memberIds.find((id) => !id.equals(viewerId))!);
  const users = await getCollection<UserDoc>("users");
  const groups = await groupNames();
  const others = new Map(
    (await users.find({ _id: { $in: otherIds }, "profile.completedAt": { $exists: true } }, { projection: MEMBER_FIELDS }).toArray()).map(
      (u) => [u._id.toHexString(), toChatMember(u, groups)],
    ),
  );
  const rows = await Promise.all(
    docs.map(async (c, i) => {
      const member = others.get(otherIds[i].toHexString());
      if (!member) return null; // the other account was deleted
      const lastMessage: ChatMessage = {
        id: "",
        mine: c.lastMessage.senderId.equals(viewerId),
        text: c.lastMessage.text,
        createdAt: c.lastMessageAt.toISOString(),
      };
      return { member, lastMessage, unread: await countUnread(c, viewerId) };
    }),
  );
  return rows.filter((r) => r !== null);
}

/**
 * A page of the conversation between the viewer and `otherId`, oldest first: the newest
 * MESSAGES_PAGE, or those before `before`. Empty if they've never talked.
 */
export async function listMessages(
  viewerId: ObjectId,
  otherId: ObjectId,
  before?: Date,
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const conversation = await findConversation(viewerId, otherId);
  if (!conversation) return { messages: [], hasMore: false };
  const messages = await getCollection<MessageDoc>("messages");
  const docs = await messages
    .find({ conversationId: conversation._id, ...(before ? { createdAt: { $lt: before } } : {}) })
    .sort({ createdAt: -1, _id: -1 })
    .limit(MESSAGES_PAGE + 1)
    .toArray();
  const hasMore = docs.length > MESSAGES_PAGE;
  return { messages: docs.slice(0, MESSAGES_PAGE).reverse().map((d) => toChatMessage(d, viewerId)), hasMore };
}
