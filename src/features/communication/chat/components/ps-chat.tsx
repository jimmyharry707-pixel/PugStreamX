"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PsButton } from "@/components/ui/ps-button";
import { cn } from "@/lib/utils/cn";
import { markChatRead, sendChatMessage } from "../actions";
import { CHAT_API_PATH, WITH_PARAM } from "../constants";
import type { ChatMember, ChatMessage, ConversationSummary } from "../types";
import { useChatStream } from "../use-chat-stream";
import { PsChatList } from "./ps-chat-list";
import { PsChatMemberPicker } from "./ps-chat-member-picker";
import { PsChatThread, type ThreadMessage } from "./ps-chat-thread";

type Thread = {
  withId: string;
  messages: ThreadMessage[];
  hasMore: boolean;
  canSend: boolean;
  /** Free text (a founder is in the conversation), or only the allowed messages. */
  freeText: boolean;
  loading: boolean;
  error: string | null;
};

type MessagesPage = { messages: ChatMessage[]; hasMore: boolean; canSend: boolean; freeText: boolean };

/** Adds messages not already there (the live stream and a send can both deliver one), in time order. */
function merge(current: ThreadMessage[], incoming: ChatMessage[]): ThreadMessage[] {
  const ids = new Set(current.map((m) => m.id));
  const added = incoming.filter((m) => !ids.has(m.id));
  if (added.length === 0) return current;
  return [...current, ...added].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Direct messages: the conversation list on the left, the open conversation on the right (on
 * phones, one at a time). The open conversation is in the URL (`?with=<memberId>`). New messages
 * arrive live through the chat stream, and opening a conversation marks it read.
 */
export function PsChat({ members, viewerIsFounder }: { members: ChatMember[]; viewerIsFounder: boolean }) {
  const withId = useSearchParams().get(WITH_PARAM);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [picking, setPicking] = useState(false);
  const listTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const readTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const open = useCallback((memberId: string | null) => {
    window.history.pushState(null, "", memberId ? `?${WITH_PARAM}=${memberId}` : window.location.pathname);
  }, []);

  const loadConversations = useCallback(async () => {
    const res = await fetch(`${CHAT_API_PATH}/conversations`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    setConversations(((await res.json()) as { conversations: ConversationSummary[] }).conversations);
  }, []);
  // Several updates at once (e.g. a burst of messages) load the list only once.
  const reloadConversations = useCallback(() => {
    clearTimeout(listTimer.current);
    listTimer.current = setTimeout(loadConversations, 250);
  }, [loadConversations]);

  // Marking read waits a moment, so a burst of incoming messages makes one request.
  const markRead = useCallback((memberId: string) => {
    clearTimeout(readTimer.current);
    readTimer.current = setTimeout(() => markChatRead(memberId), 300);
  }, []);

  const loadThread = useCallback(
    async (memberId: string) => {
      const res = await fetch(`${CHAT_API_PATH}/messages?${WITH_PARAM}=${memberId}`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok) {
        const error = res?.status === 404 || res?.status === 400 ? "This conversation isn't available." : "Couldn't load messages. Try again.";
        setThread((t) => (t?.withId === memberId ? { ...t, loading: false, error } : t));
        return;
      }
      const page = (await res.json()) as MessagesPage;
      setThread((t) =>
        t?.withId === memberId ? { ...t, ...page, messages: merge(t.messages.filter((m) => m.pending || m.failed), page.messages), loading: false, error: null } : t,
      );
      markRead(memberId);
    },
    [markRead],
  );

  useEffect(() => {
    // Loading data from the server on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
    return () => {
      clearTimeout(listTimer.current);
      clearTimeout(readTimer.current);
    };
  }, [loadConversations]);

  // Opening a conversation (or switching to another) loads its messages.
  useEffect(() => {
    if (!withId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThread(null);
      return;
    }
    setThread({ withId, messages: [], hasMore: false, canSend: true, freeText: false, loading: true, error: null });
    loadThread(withId);
  }, [withId, loadThread]);

  useChatStream((update) => {
    if (update.type === "resync") {
      // Reconnected: anything sent meanwhile was missed, so load again.
      reloadConversations();
      if (withId) loadThread(withId);
      return;
    }
    reloadConversations();
    if (update.type === "message" && update.with === withId) {
      setThread((t) => (t?.withId === update.with ? { ...t, messages: merge(t.messages, [update.message]) } : t));
      // Reading it now: clear its unread count (only while this tab is being looked at).
      if (!update.message.mine && document.visibilityState === "visible") markRead(update.with);
    }
  });

  // Back to a tab with the conversation open: what arrived meanwhile has now been seen.
  useEffect(() => {
    if (!withId) return;
    const onVisible = () => document.visibilityState === "visible" && markRead(withId);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [withId, markRead]);

  async function loadEarlier() {
    if (!thread || thread.messages.length === 0) return;
    const before = thread.messages.find((m) => !m.pending && !m.failed)?.createdAt;
    if (!before) return;
    const res = await fetch(`${CHAT_API_PATH}/messages?${WITH_PARAM}=${thread.withId}&before=${encodeURIComponent(before)}`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const page = (await res.json()) as MessagesPage;
    setThread((t) => (t?.withId === thread.withId ? { ...t, hasMore: page.hasMore, messages: merge(t.messages, page.messages) } : t));
  }

  async function send(text: string): Promise<string | null> {
    if (!thread) return "Choose a conversation first.";
    const to = thread.withId;
    // Shown at once, greyed out, until the server confirms it.
    const temp: ThreadMessage = { id: `pending-${crypto.randomUUID()}`, mine: true, text, createdAt: new Date().toISOString(), pending: true };
    setThread((t) => (t?.withId === to ? { ...t, messages: [...t.messages, temp] } : t));
    const result = await sendChatMessage(to, text).catch(() => ({ ok: false as const, message: "Couldn't send. Check your connection and try again." }));
    setThread((t) => {
      if (t?.withId !== to) return t;
      const rest = t.messages.filter((m) => m.id !== temp.id);
      return { ...t, messages: result.ok ? merge(rest, [result.message]) : rest };
    });
    if (!result.ok) return result.message;
    reloadConversations();
    return null;
  }

  // The open conversation's member: from the list, or (for a deactivated member) from the conversations.
  const member = withId ? (members.find((m) => m.id === withId) ?? conversations?.find((c) => c.member.id === withId)?.member ?? null) : null;

  return (
    // Fills the space below the 4rem topbar; the list and the messages scroll inside.
    <div className="flex h-[calc(100dvh-4rem)] min-h-[28rem]">
      <aside
        aria-label="Chats"
        className={cn("w-full shrink-0 flex-col border-r border-white/10 md:flex md:w-80", withId ? "hidden" : "flex")}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4">
          <h1 className="text-lg font-semibold text-white">Chat</h1>
          <PsButton type="button" size="sm" onClick={() => setPicking(true)}>
            New message
          </PsButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PsChatList conversations={conversations} selectedId={withId} onSelect={open} />
        </div>
      </aside>

      <div className={cn("min-w-0 flex-1 flex-col", withId ? "flex" : "hidden md:flex")}>
        {thread && member ? (
          <PsChatThread
            key={thread.withId}
            member={member}
            messages={thread.messages}
            loading={thread.loading}
            hasMore={thread.hasMore}
            canSend={thread.canSend}
            freeText={thread.freeText}
            error={thread.error}
            onLoadEarlier={loadEarlier}
            onSend={send}
            onBack={() => open(null)}
          />
        ) : withId && conversations ? (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div className="space-y-3">
              <p className="text-sm text-gray-400">This conversation isn&apos;t available.</p>
              <PsButton type="button" variant="secondary" size="sm" onClick={() => open(null)}>
                Back to conversations
              </PsButton>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div className="space-y-1">
              <p className="text-4xl" aria-hidden>
                💬
              </p>
              <p className="text-sm text-gray-400">Choose a conversation, or start one with New message.</p>
            </div>
          </div>
        )}
      </div>

      {picking && (
        <PsChatMemberPicker
          members={members}
          viewerIsFounder={viewerIsFounder}
          onClose={() => setPicking(false)}
          onPick={(id) => {
            setPicking(false);
            open(id);
          }}
        />
      )}
    </div>
  );
}
