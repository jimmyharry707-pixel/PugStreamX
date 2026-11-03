"use server";

import { ObjectId } from "mongodb";
import { requireCompleteProfile } from "@/features/account/auth/dal";
import { publishChatEvent } from "./bus";
import { markConversationRead, createMessage } from "./mutations";
import { findChatMember, toChatMessage } from "./queries";
import { allowsFreeText, isTemplateMessage } from "./templates";
import type { ChatMessage } from "./types";
import { memberIdSchema, messageSchema } from "./validation";

/**
 * Sends a direct message, to a member of the sender's group or a founder (founders can message
 * anyone; see `findChatMember`). Unless a founder is in the conversation, the text must be one of
 * the allowed messages (`templates.ts`), word for word.
 * The recipient's open streams (and the sender's other tabs) get it at once.
 */
export async function sendChatMessage(to: string, text: string): Promise<{ ok: true; message: ChatMessage } | { ok: false; message: string }> {
  const user = await requireCompleteProfile();
  const parsed = messageSchema.safeParse({ to, text });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "This message can't be sent." };

  const me = new ObjectId(user.id);
  const toId = new ObjectId(parsed.data.to);
  const member = await findChatMember(user, toId);
  if (!member) return { ok: false, message: "You can only message your group and the founders." };
  if (!allowsFreeText(user.isSuperAdmin, member.isFounder) && !isTemplateMessage(parsed.data.text)) {
    return { ok: false, message: "Choose one of the suggested messages. Only messages to a founder can be written freely." };
  }

  const doc = await createMessage(me, toId, parsed.data.text);
  publishChatEvent(toId.toHexString(), { type: "message", with: user.id, message: toChatMessage(doc, toId) });
  publishChatEvent(user.id, { type: "message", with: toId.toHexString(), message: toChatMessage(doc, me) });
  return { ok: true, message: toChatMessage(doc, me) };
}

/** Marks the conversation with `withId` as read, so its unread count (and the left-panel badge) clears. */
export async function markChatRead(withId: string): Promise<void> {
  const user = await requireCompleteProfile();
  const parsed = memberIdSchema.safeParse(withId);
  if (!parsed.success) return;
  // The viewer's other tabs update their counts too.
  if (await markConversationRead(new ObjectId(user.id), new ObjectId(parsed.data))) publishChatEvent(user.id, { type: "read", with: parsed.data });
}
