import type { ObjectId } from "mongodb";

/** A direct conversation between two members, in `ps_conversations`. Created with its first message. */
export type ConversationDoc = {
  _id: ObjectId;
  /** "<smaller id>:<larger id>" (hex), so a pair of members has only one conversation. */
  key: string;
  memberIds: [ObjectId, ObjectId];
  lastMessageAt: Date;
  /** For the conversation list. */
  lastMessage: { senderId: ObjectId; text: string };
  /** When each member (by hex id) last read it; messages after that are unread for them. */
  readAt: Record<string, Date>;
  createdAt: Date;
};

/** A message in `ps_messages`. Plain text. */
export type MessageDoc = {
  _id: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
  text: string;
  createdAt: Date;
};

/** Someone you can message: an active member with a complete profile. */
export type ChatMember = {
  id: string;
  fullName: string;
  displayName: string;
  avatarUrl: string;
  /** Role label, e.g. "Profile Manager". */
  role: string;
  isFounder: boolean;
  /** Their group's name, or null if they have none. */
  groupName: string | null;
};

/** A message as sent to the browser. */
export type ChatMessage = {
  id: string;
  /** True if the viewer sent it. */
  mine: boolean;
  text: string;
  /** ISO time. */
  createdAt: string;
};

/** One row of the conversation list. */
export type ConversationSummary = {
  /** The other member. */
  member: ChatMember;
  lastMessage: ChatMessage;
  /** Messages from the other member the viewer hasn't read. */
  unread: number;
};

/** What the live stream (`/api/chat/stream`) sends: a new message in the conversation with `with`. */
export type ChatStreamEvent = { type: "message"; with: string; message: ChatMessage } | { type: "read"; with: string };
