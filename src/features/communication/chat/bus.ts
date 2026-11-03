import "server-only";
import { EventEmitter } from "node:events";
import type { ChatStreamEvent } from "./types";

// Delivers chat events to the live streams (`/api/chat/stream`) open in this server process.
// Kept on globalThis so it's shared by every route and survives dev hot reloads.
//
// It only reaches members connected to the same process. Running several server instances would
// need a shared channel instead (e.g. MongoDB change streams on a replica set, or Redis pub/sub).

const globalForBus = globalThis as typeof globalThis & { psChatBus?: EventEmitter };
const bus = (globalForBus.psChatBus ??= new EventEmitter().setMaxListeners(0));

/** Sends `event` to every open stream of member `userId` (hex id). */
export function publishChatEvent(userId: string, event: ChatStreamEvent): void {
  bus.emit(userId, event);
}

/** Calls `listener` for each event for member `userId`. Returns the unsubscribe function. */
export function subscribeChatEvents(userId: string, listener: (event: ChatStreamEvent) => void): () => void {
  bus.on(userId, listener);
  return () => bus.off(userId, listener);
}
