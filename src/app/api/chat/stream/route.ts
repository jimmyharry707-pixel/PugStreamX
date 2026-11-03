import { getCurrentUser } from "@/features/account/auth/dal";
import { subscribeChatEvents } from "@/features/communication/chat/bus";

/** A comment line now and then keeps proxies from closing an idle stream. */
const HEARTBEAT_MS = 25_000;
/**
 * Each stream ends after this; the browser's EventSource reconnects by itself, and that request
 * checks the session again (so a deactivated account stops getting messages).
 */
const LIFETIME_MS = 5 * 60_000;

// GET /api/chat/stream: a server-sent event stream of the signed-in member's chat events
// (`ChatStreamEvent`, as `data:` JSON): new messages to or from them, and conversations they read.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup(); // already closed
        }
      };
      // Retry after 2 s if the connection drops; the first comment opens the stream at once.
      send("retry: 2000\n: connected\n\n");
      const unsubscribe = subscribeChatEvents(user.id, (event) => send(`data: ${JSON.stringify(event)}\n\n`));
      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);
      const end = setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {}
      }, LIFETIME_MS);
      cleanup = () => {
        unsubscribe();
        clearInterval(heartbeat);
        clearTimeout(end);
      };
      request.signal.addEventListener("abort", () => cleanup());
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // no-transform: compression would hold events back until enough bytes build up.
      "Cache-Control": "private, no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
