"use client";

import { PsAvatar } from "@/components/ui/ps-avatar";
import { cn } from "@/lib/utils/cn";
import { formatListTime, formatUnread } from "../format";
import type { ConversationSummary } from "../types";

/** The viewer's conversations, most recent first. `selectedId` is the open one's member id. */
export function PsChatList({
  conversations,
  selectedId,
  onSelect,
}: {
  /** Null while loading. */
  conversations: ConversationSummary[] | null;
  selectedId: string | null;
  onSelect: (memberId: string) => void;
}) {
  if (!conversations) {
    return (
      <ul aria-busy="true" className="space-y-1 p-2">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3 rounded-lg p-2">
            <span className="size-10 shrink-0 animate-pulse rounded-full bg-gray-800" />
            <span className="h-3 flex-1 animate-pulse rounded bg-gray-800" />
          </li>
        ))}
      </ul>
    );
  }
  if (conversations.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-gray-500">No conversations yet. Start one with New message.</p>;
  }
  return (
    <ul aria-label="Conversations" className="space-y-0.5 p-2">
      {conversations.map(({ member, lastMessage, unread }) => {
        const selected = member.id === selectedId;
        return (
          <li key={member.id}>
            <button
              type="button"
              onClick={() => onSelect(member.id)}
              aria-current={selected ? "true" : undefined}
              data-member-id={member.id}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg p-2 text-left transition",
                selected ? "bg-brand-400/10" : "hover:bg-white/5",
              )}
            >
              <PsAvatar name={member.fullName} src={member.avatarUrl} size="md" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={cn("truncate text-sm", unread ? "font-semibold text-white" : "text-gray-100")}>{member.fullName}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-gray-500">{formatListTime(lastMessage.createdAt)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className={cn("truncate text-xs", unread ? "text-gray-200" : "text-gray-500")}>
                    {lastMessage.mine && "You: "}
                    {lastMessage.text}
                  </span>
                  {unread > 0 && (
                    <span className="ml-auto shrink-0 rounded-full bg-brand-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-gray-950">
                      {formatUnread(unread)}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
