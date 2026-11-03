"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_API_PATH } from "../constants";
import { formatUnread } from "../format";
import type { ConversationSummary } from "../types";
import { useChatStream } from "../use-chat-stream";

/** Total unread messages, for the left panel's Chat link. Updates live; hidden at 0. */
export function PsChatUnreadBadge() {
  const [unread, setUnread] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async () => {
    const res = await fetch(`${CHAT_API_PATH}/conversations`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const { conversations } = (await res.json()) as { conversations: ConversationSummary[] };
    setUnread(conversations.reduce((sum, c) => sum + c.unread, 0));
  }, []);

  useEffect(() => {
    // Loading data from the server on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => clearTimeout(timer.current);
  }, [load]);

  // Any change (a new message, a conversation read in this or another tab): count again, once.
  useChatStream(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(load, 300);
  });

  if (unread === 0) return null;
  return (
    <span data-chat-unread={unread} className="ml-auto rounded-full bg-brand-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-gray-950">
      {formatUnread(unread)}
      <span className="sr-only"> unread</span>
    </span>
  );
}
