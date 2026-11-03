"use client";

import { useEffect, useRef } from "react";
import { CHAT_API_PATH } from "./constants";
import type { ChatStreamEvent } from "./types";

/** A stream event, or "resync" after a reconnect (events may have been missed: load again). */
export type ChatStreamUpdate = ChatStreamEvent | { type: "resync" };

// One EventSource per tab, shared by everything listening (the chat page and the left-panel
// badge), opened while anyone listens.
const listeners = new Set<(update: ChatStreamUpdate) => void>();
let source: EventSource | null = null;

function open() {
  let opened = false;
  source = new EventSource(`${CHAT_API_PATH}/stream`);
  source.onopen = () => {
    // The first open is the start; later ones are reconnects (dropped, or the server's time limit).
    if (opened) listeners.forEach((l) => l({ type: "resync" }));
    opened = true;
  };
  source.onmessage = (e) => {
    let event: ChatStreamEvent;
    try {
      event = JSON.parse(e.data);
    } catch {
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
