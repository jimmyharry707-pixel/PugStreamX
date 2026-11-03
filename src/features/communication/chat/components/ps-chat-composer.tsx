"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { PsButton } from "@/components/ui/ps-button";
import { cn } from "@/lib/utils/cn";
import { MESSAGE_MAX } from "../constants";
import { isTemplateMessage, searchTemplates, type ChatTemplate } from "../templates";

const fieldClass =
  "max-h-40 min-h-10 w-full resize-none rounded-2xl border border-white/10 bg-gray-900 px-4 py-2 text-sm text-gray-100 placeholder:text-gray-500 [field-sizing:content] focus:border-brand-400 focus:outline-none";

/** Suggestions grouped by category, in list order, keeping each one's index in the flat list. */
function byCategory(list: ChatTemplate[]) {
  const groups = new Map<string, { template: ChatTemplate; index: number }[]>();
  list.forEach((template, index) => groups.set(template.category, [...(groups.get(template.category) ?? []), { template, index }]));
  return [...groups.entries()];
}

/**
 * The message box under a conversation.
 * - `freeText` (a founder is in the conversation): write anything. Enter sends; Shift+Enter adds a line.
 * - Otherwise: typing searches the allowed messages (`src/static/data/chat-messages.json`), shown
 *   by category above the box. ↑/↓ move, Enter or a click picks one, Esc closes the list. Only a
 *   message from the list can be sent (the server checks it too).
 */
export function PsChatComposer({
  memberName,
  freeText,
  onSend,
}: {
  memberName: string;
  freeText: boolean;
  /** Resolves to an error message, or null once sent. */
  onSend: (text: string) => Promise<string | null>;
}) {
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState(0);
  const fieldRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const listId = useId();

  const suggestions = freeText ? [] : searchTemplates(draft);
  const valid = freeText ? draft.trim() !== "" : isTemplateMessage(draft);
  const showList = !freeText && listOpen && suggestions.length > 0;
  const activeIndex = Math.min(active, suggestions.length - 1);

  async function send() {
    const text = draft.trim();
    if (!valid) return;
    setDraft("");
    setSendError(null);
    setListOpen(false);
    const failed = await onSend(text);
    if (failed) {
      // Put it back so nothing typed is lost.
      setDraft((current) => current || text);
      setSendError(failed);
    }
    fieldRef.current?.focus();
  }

  function pick(template: ChatTemplate) {
    setDraft(template.context);
    setListOpen(false);
    setSendError(null);
    fieldRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.nativeEvent.isComposing) return;
    if (!freeText) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!showList) {
          setListOpen(true);
          setActive(0);
          return;
        }
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((activeIndex + step + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Escape" && showList) {
        e.preventDefault();
        setListOpen(false);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        // The highlighted suggestion first; once a listed message is in the box, Enter sends it.
        if (showList && !valid) pick(suggestions[activeIndex]);
        else send();
        return;
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <form
      aria-label="Send a message"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="relative shrink-0 border-t border-white/10 p-3 sm:px-4"
    >
      {sendError && (
        <p role="alert" className="mb-2 text-sm text-danger-400">
          {sendError}
        </p>
      )}

      {showList && (
        <div
          id={listId}
          role="listbox"
          aria-label="Suggested messages"
          // Clicking an option mustn't take focus from the box.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-3 bottom-full z-20 mb-2 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-gray-900 p-1.5 shadow-2xl shadow-black/50 sm:inset-x-4"
        >
          {byCategory(suggestions).map(([category, items]) => (
            <div key={category} role="group" aria-label={category}>
              <p aria-hidden className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {category}
              </p>
              {items.map(({ template, index }) => (
                <div
                  key={template.context}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  data-template={template.context}
                  onClick={() => pick(template)}
                  onMouseMove={() => index !== activeIndex && setActive(index)}
                  className={cn("cursor-pointer rounded-lg px-2.5 py-1.5 text-sm text-gray-200", index === activeIndex && "bg-white/10 text-white")}
                >
                  {template.context}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {freeText ? (
          <textarea
            ref={fieldRef}
            name="text"
            aria-label={`Message ${memberName}`}
            placeholder={`Message ${memberName}`}
            rows={1}
            maxLength={MESSAGE_MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            className={cn(fieldClass, "flex-1")}
          />
        ) : (
          <input
            ref={fieldRef}
            name="text"
            type="text"
            role="combobox"
            aria-label={`Message ${memberName}: search the suggested messages`}
            aria-autocomplete="list"
            aria-expanded={showList}
            aria-controls={showList ? listId : undefined}
            aria-activedescendant={showList ? `${listId}-${activeIndex}` : undefined}
            placeholder="Type to search messages…"
            autoComplete="off"
            maxLength={MESSAGE_MAX}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setListOpen(true);
              setActive(0);
              setSendError(null);
            }}
            onFocus={() => setListOpen(true)}
            onBlur={() => setListOpen(false)}
            onClick={() => setListOpen(true)}
            onKeyDown={onKeyDown}
            className={cn(fieldClass, "flex-1")}
          />
        )}
        <PsButton type="submit" size="sm" disabled={!valid} className="h-10">
          Send
        </PsButton>
      </div>

      {!freeText && (
        <p className={cn("mt-1.5 px-1 text-xs", draft.trim() && !valid ? "text-warning-300" : "text-gray-500")}>
          {draft.trim() && !valid
            ? suggestions.length
              ? "Pick a message from the list to send it."
              : "No suggested message matches. Only messages to a founder can be written freely."
            : "Choose from the suggested messages. Only messages to a founder can be written freely."}
        </p>
      )}
    </form>
  );
}
