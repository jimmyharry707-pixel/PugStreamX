"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { CHAT_API_PATH } from "./constants";
import type { ChatStreamEvent } from "./types";

/** A message or read event, or "resync" after a reconnect (events may have been missed: load again). */
export type ChatStreamUpdate = Exclude<ChatStreamEvent, { type: "presence" | "presence-change" }> | { type: "resync" };

// One EventSource per tab, shared by everything listening (the chat page, the left-panel badge
// and the online dots), opened while anyone listens.
const listeners = new Set<(update: ChatStreamUpdate) => void>();
let source: EventSource | null = null;

// Presence, kept here so every component sees the same: whether this tab's stream is connected
// (the viewer counts as online while it is), and which of the viewer's contacts are online.
let connected = false;
/** Null until the first presence list of this connection arrives. */
let online: ReadonlySet<string> | null = null;
const presenceListeners = new Set<() => void>();
const changed = () => presenceListeners.forEach((l) => l());

function open() {
  let opened = false;
  source = new EventSource(`${CHAT_API_PATH}/stream`);
  source.onopen = () => {
    connected = true;
    changed();
    // The first open is the start; later ones are reconnects (dropped, or the server's time limit).
    if (opened) listeners.forEach((l) => l({ type: "resync" }));
    opened = true;
  };
  source.onerror = () => {
    // Reconnecting (or gone): offline until it opens again, when a fresh presence list arrives.
    connected = false;
    changed();
  };
  source.onmessage = (e) => {
    let event: ChatStreamEvent;
    try {
      event = JSON.parse(e.data);
    } catch {
      return;
    }
    if (event.type === "presence") {
      online = new Set(event.online);
      changed();
      return;
    }
    if (event.type === "presence-change") {
      const next = new Set(online ?? []);
      if (event.online) next.add(event.id);
      else next.delete(event.id);
      online = next;
      changed();
      return;
    }
    listeners.forEach((l) => l(event));
  };
}

function subscribe(listener: (update: ChatStreamUpdate) => void): () => void {
  listeners.add(listener);
  if (!source) open();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      source?.close();
      source = null;
      connected = false;
      online = null;
      changed();
    }
  };
}

/** Calls `onUpdate` for every live chat update while mounted. */
export function useChatStream(onUpdate: (update: ChatStreamUpdate) => void): void {
  const ref = useRef(onUpdate);
  useEffect(() => {
    ref.current = onUpdate;
  });
  useEffect(() => subscribe((update) => ref.current(update)), []);
}

/** Watching presence also keeps the stream open (it's what makes the viewer online). */
function subscribePresence(onChange: () => void): () => void {
  presenceListeners.add(onChange);
  const unsubscribe = subscribe(() => {});
  return () => {
    presenceListeners.delete(onChange);
    unsubscribe();
  };
}

/** Whether the viewer is online: this tab's live connection is open. Null while rendering on the server. */
export function useSelfOnline(): boolean | null {
  return useSyncExternalStore(
    subscribePresence,
    () => connected,
    () => null,
  );
}

/**
 * Which of the viewer's contacts are online (hex ids). Null until known (server render, before the
 * stream's first presence list): show no status then rather than "offline" for everyone.
 */
export function useOnlineMembers(): ReadonlySet<string> | null {
  return useSyncExternalStore(
    subscribePresence,
    () => online,
    () => null,
  );
}
