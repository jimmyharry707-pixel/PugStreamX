"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { PsAvatar } from "@/components/ui/ps-avatar";
import { PsButton } from "@/components/ui/ps-button";
import { PsIconButton } from "@/components/ui/ps-icon-button";
import { cn } from "@/lib/utils/cn";
import { formatDayLabel, formatMessageTime, isSameLocalDay, splitLinks } from "../format";
import type { ChatMember, ChatMessage } from "../types";
import { PsChatComposer } from "./ps-chat-composer";

/** A message in the thread; `pending` while it's being sent, `failed` if that didn't work. */
export type ThreadMessage = ChatMessage & { pending?: boolean; failed?: boolean };

/** Within this many pixels of the bottom counts as "at the bottom" (new messages scroll into view). */
const NEAR_BOTTOM = 80;

function MessageText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        part.href ? (
          <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-2">
            {part.text}
          </a>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * One conversation: the other member at the top, the messages (oldest first, with day
 * separators), and the message box at the bottom (`PsChatComposer`: free text with a founder,
 * otherwise the allowed messages only).
 */
export function PsChatThread({
  member,
  messages,
  loading,
  hasMore,
  canSend,
  freeText,
  error,
  onLoadEarlier,
  onSend,
  onBack,
}: {
  member: ChatMember;
  messages: ThreadMessage[];
  loading: boolean;
  hasMore: boolean;
  /** False when the viewer can't message the other member any more (deactivated, or moved to another group). */
  canSend: boolean;
  /** Free text (a founder is in the conversation), or only the allowed messages. */
  freeText: boolean;
  error: string | null;
  onLoadEarlier: () => Promise<void>;
  /** Resolves to an error message, or null once sent. */
  onSend: (text: string) => Promise<string | null>;
  /** Phones: back to the conversation list. */
  onBack: () => void;
}) {
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // How to scroll after the next render: to the bottom, keep the view (older messages added above), or not at all.
  const scrollPlan = useRef<{ kind: "bottom" } | { kind: "keep"; fromBottom: number } | null>({ kind: "bottom" });
  // Kept up to date while scrolling: new messages are followed only when we're at the bottom (or they're ours).
  const atBottom = useRef(true);
  const lastSeenId = useRef<string | undefined>(undefined);
  const last = messages.at(-1);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || loading) return;
    if (last?.id !== lastSeenId.current) {
      if (!scrollPlan.current && (atBottom.current || last?.mine)) scrollPlan.current = { kind: "bottom" };
      lastSeenId.current = last?.id;
    }
    const plan = scrollPlan.current;
    if (!plan) return;
    el.scrollTop = plan.kind === "bottom" ? el.scrollHeight : el.scrollHeight - plan.fromBottom;
    scrollPlan.current = null;
  });

  async function loadEarlier() {
    const el = scrollRef.current;
    if (el) scrollPlan.current = { kind: "keep", fromBottom: el.scrollHeight - el.scrollTop };
    setLoadingEarlier(true);
    await onLoadEarlier();
    setLoadingEarlier(false);
  }

  // Our own message: scroll down to it.
  function send(text: string) {
    scrollPlan.current = { kind: "bottom" };
    return onSend(text);
  }

  return (
    <section aria-label={`Conversation with ${member.fullName}`} className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-3 sm:px-4">
        <PsIconButton label="Back to conversations" onClick={onBack} className="size-9 md:hidden">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
            <path d="m15 6-6 6 6 6" />
          </svg>
        </PsIconButton>
        <PsAvatar name={member.fullName} src={member.avatarUrl} size="md" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-white">{member.fullName}</h2>
          <p className="truncate text-xs text-gray-500">
            @{member.displayName} · {member.isFounder ? "Founder" : [member.role, member.groupName].filter(Boolean).join(" · ")}
          </p>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6"
        aria-busy={loading || undefined}
      >
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500">Loading messages…</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-danger-300">{error}</p>
        ) : (
          <>
            {hasMore && (
              <div className="mb-4 flex justify-center">
                <PsButton type="button" variant="secondary" size="sm" onClick={loadEarlier} disabled={loadingEarlier}>
                  {loadingEarlier ? "Loading…" : "Load earlier messages"}
                </PsButton>
              </div>
            )}
            {messages.length === 0 && <p className="py-10 text-center text-sm text-gray-500">No messages yet. Say hello to {member.fullName}.</p>}
            <ol aria-label="Messages" className="space-y-1">
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const newDay = !prev || !isSameLocalDay(prev.createdAt, m.createdAt);
                // Consecutive messages from the same side sit closer together.
                const sameSide = !newDay && prev?.mine === m.mine;
                return (
                  <Fragment key={m.id}>
                    {newDay && (
                      <li aria-hidden className="py-3 text-center text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        {formatDayLabel(m.createdAt)}
                      </li>
                    )}
                    <li data-mine={m.mine || undefined} className={cn("flex", m.mine ? "justify-end" : "justify-start", !sameSide && "pt-2")}>
                      <div
                        className={cn(
                          "max-w-[min(32rem,85%)] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                          m.mine ? "rounded-br-md bg-brand-400 text-gray-950" : "rounded-bl-md bg-gray-800 text-gray-100",
                          m.pending && "opacity-60",
                          m.failed && "ring-2 ring-danger-500",
                        )}
                      >
                        <MessageText text={m.text} />
                        <span className={cn("mt-0.5 block text-right text-[10px]", m.mine ? "text-gray-950/60" : "text-gray-400")}>
                          {m.failed ? "Not sent" : m.pending ? "Sending…" : formatMessageTime(m.createdAt)}
                        </span>
                      </div>
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          </>
        )}
      </div>

      {canSend ? (
        <PsChatComposer key={freeText ? "free" : "list"} memberName={member.fullName} freeText={freeText} onSend={send} />
      ) : (
        // Deactivated, or no longer in the viewer's group (you can chat with your group and the founders).
        <p className="shrink-0 border-t border-white/10 p-4 text-center text-sm text-gray-500">
          You can&apos;t message {member.fullName} any more. You can chat with your group and the founders.
        </p>
      )}
    </section>
  );
}
