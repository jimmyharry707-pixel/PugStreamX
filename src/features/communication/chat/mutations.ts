import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { pairKey } from "./queries";
import type { ConversationDoc, MessageDoc } from "./types";

// Callers (actions.ts) check that both members may chat first.

/** Saves a message from `senderId` to `toId`, creating their conversation on the first one. */
export async function createMessage(senderId: ObjectId, toId: ObjectId, text: string): Promise<MessageDoc> {
  const now = new Date();
  const conversations = await getCollection<ConversationDoc>("conversations");
  // Upsert: the unique `key` keeps it to one conversation per pair, even if both write at once.
  const conversation = await conversations.findOneAndUpdate(
    { key: pairKey(senderId, toId) },
    {
      $setOnInsert: { memberIds: [senderId, toId], createdAt: now },
      // Sending counts as reading everything before it.
      $set: { lastMessageAt: now, lastMessage: { senderId, text }, [`readAt.${senderId.toHexString()}`]: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  const message: MessageDoc = { _id: new ObjectId(), conversationId: conversation!._id, senderId, text, createdAt: now };
  const messages = await getCollection<MessageDoc>("messages");
  await messages.insertOne(message);
  return message;
}

/** Marks the conversation between the two as read by `readerId`, up to now. False if there's none. */
export async function markConversationRead(readerId: ObjectId, otherId: ObjectId): Promise<boolean> {
  const conversations = await getCollection<ConversationDoc>("conversations");
  const result = await conversations.updateOne({ key: pairKey(readerId, otherId) }, { $set: { [`readAt.${readerId.toHexString()}`]: new Date() } });
  return result.matchedCount > 0;
}

/** Removes every conversation of a deleted account, and their messages. */
export async function deleteConversationsOf(userId: ObjectId): Promise<void> {
  const conversations = await getCollection<ConversationDoc>("conversations");
  const ids = (await conversations.find({ memberIds: userId }, { projection: { _id: 1 } }).toArray()).map((c) => c._id);
  if (ids.length === 0) return;
  const messages = await getCollection<MessageDoc>("messages");
  await messages.deleteMany({ conversationId: { $in: ids } });
  await conversations.deleteMany({ _id: { $in: ids } });
}
