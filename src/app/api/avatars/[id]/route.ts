import { ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { getCurrentUser } from "@/features/auth/dal";
import { openAvatar } from "@/features/profile/avatar";

// GET /api/avatars/:id: avatar images, for signed-in members with a completed profile only.
// A new upload always gets a new id, so responses can be cached for a long time.
export async function GET(_request: Request, { params }: RouteContext<"/api/avatars/[id]">) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return new Response("Not found", { status: 404 });

  const avatar = await openAvatar(new ObjectId(id));
  if (!avatar) return new Response("Not found", { status: 404 });

  return new Response(Readable.toWeb(avatar.stream) as ReadableStream, {
    headers: {
      "Content-Type": avatar.contentType,
      "Content-Length": String(avatar.length),
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
