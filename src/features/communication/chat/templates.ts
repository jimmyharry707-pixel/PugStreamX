// The messages members may send each other (`src/static/data/chat-messages.json`). Conversations
// with a founder are free text; every other message must be one of these, word for word.
// Shared by server (the check in sendChatMessage) and client (the suggestions). Edit the JSON to
// change the list.
import data from "@/static/data/chat-messages.json";

/** One allowed message: its `category` (e.g. "Schedule") and its text, `context`. */
export type ChatTemplate = { category: string; context: string };

export const CHAT_TEMPLATES: readonly ChatTemplate[] = (data as ChatTemplate[]).map((t) => ({ category: t.category.trim(), context: t.context.trim() }));

const ALLOWED = new Set(CHAT_TEMPLATES.map((t) => t.context));

/** True if `text` is exactly one of the allowed messages. */
export const isTemplateMessage = (text: string) => ALLOWED.has(text.trim());

/**
 * Free text is allowed only when a founder is in the conversation: messages to a founder, and
 * a founder's own messages. Everyone else picks from the list.
 */
export const allowsFreeText = (senderIsFounder: boolean, recipientIsFounder: boolean) => senderIsFounder || recipientIsFounder;

/**
 * The allowed messages matching what's typed, in list order: every word must appear in the
 * message or its category (ignoring case). Empty text matches everything.
 */
export function searchTemplates(query: string): ChatTemplate[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...CHAT_TEMPLATES];
  return CHAT_TEMPLATES.filter((t) => {
    const haystack = `${t.category} ${t.context}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}
