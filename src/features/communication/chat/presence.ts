import "server-only";
import type { PublicUser } from "@/features/account/users/types";
import { publishChatEvent } from "./bus";
import { onlineContactsOf } from "./queries";

// Who's online: a member is online while at least one of their chat streams (`/api/chat/stream`,
// open on every main-site page through the left panel's Chat badge) is connected.
//
// Like the bus, it only knows the streams of this server process; several instances would need a
// shared store (e.g. Redis). Kept on globalThis so it survives dev hot reloads.

/**
 * Streams end every few minutes and the browser reconnects, and a page reload drops the stream
 * for a moment, so going offline waits this long for a new stream first.
 */
export const OFFLINE_GRACE_MS = 15_000;

type Presence = { streams: Map<string, number>; leaving: Map<string, ReturnType<typeof setTimeout>> };
const globalForPresence = globalThis as typeof globalThis & { psChatPresence?: Presence };
const presence = (globalForPresence.psChatPresence ??= { streams: new Map(), leaving: new Map() });

/** Whether member `userId` (hex id) has a stream open (or had one less than the grace period ago). */
export function isOnline(userId: string): boolean {
  return presence.streams.has(userId) || presence.leaving.has(userId);
}

/** Everyone online, as hex ids. */
export function onlineIds(): string[] {
  return [...new Set([...presence.streams.keys(), ...presence.leaving.keys()])];
}

/** Tells `user`'s online contacts (whoever can message them) that they came online or went offline. */
async function announce(user: PublicUser, online: boolean) {
  try {
    for (const id of await onlineContactsOf(user, onlineIds())) publishChatEvent(id, { type: "presence-change", id: user.id, online });
  } catch (err) {
    console.error("Couldn't announce presence:", err);
  }
}

/** A stream of `user` opened. Call the returned function once when it closes. */
export function streamOpened(user: PublicUser): () => void {
  const pendingLeave = presence.leaving.get(user.id);
  const wasOnline = isOnline(user.id);
  if (pendingLeave) {
    // Back within the grace period (a reconnect): still online, nobody needs telling.
    clearTimeout(pendingLeave);
    presence.leaving.delete(user.id);
  }
  presence.streams.set(user.id, (presence.streams.get(user.id) ?? 0) + 1);
  if (!wasOnline) void announce(user, true);

  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    const left = (presence.streams.get(user.id) ?? 1) - 1;
    if (left > 0) {
      presence.streams.set(user.id, left);
      return;
    }
    presence.streams.delete(user.id);
    presence.leaving.set(
      user.id,
      setTimeout(() => {
        presence.leaving.delete(user.id);
        if (!presence.streams.has(user.id)) void announce(user, false);
      }, OFFLINE_GRACE_MS),
    );
  };
}
