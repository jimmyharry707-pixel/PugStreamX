import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/features/account/auth/dal";
import { seekerAccess } from "@/features/work/seeker/access";
import { readWorkFile, type WorkResultViewer } from "@/features/work/seeker/queries";

/**
 * The uploaded pages are untrusted HTML, so they're shown in a sandbox: no scripts, forms,
 * popups or plugins, and an opaque origin (no access to this site's cookies or pages). Only
 * styles, images, fonts and media load, so saved pages still look right.
 */
const SANDBOX_CSP = [
  "sandbox",
  "default-src 'none'",
  "style-src 'unsafe-inline' https: data:",
  "img-src https: data:",
  "font-src https: data:",
  "media-src https: data:",
  "frame-ancestors 'none'",
].join("; ");

// GET /api/work-results/:id/files/:index: one uploaded page, shown in the browser (not
// downloaded). For the job seeker who uploaded it, the Profile Managers of their group and founders.
export async function GET(_request: Request, { params }: RouteContext<"/api/work-results/[id]/files/[index]">) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return new Response("Unauthorized", { status: 401 });

  const { id, index } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id) || !/^\d{1,4}$/.test(index)) return new Response("Not found", { status: 404 });

  const access = seekerAccess(user);
  let viewer: WorkResultViewer | null = null;
  if (access.mode === "upload") viewer = { userId: new ObjectId(user.id) };
  else if (access.mode === "group" && access.groupId) viewer = { groupId: new ObjectId(access.groupId) };
  else if (access.mode === "all") viewer = { all: true };
  if (!viewer) return new Response("Not found", { status: 404 });

  const found = await readWorkFile(new ObjectId(id), Number(index), viewer);
  if (!found) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(found.bytes), {
    headers: {
      // No charset: the browser takes it from the page's own <meta charset>.
      "Content-Type": "text/html",
      "Content-Length": String(found.bytes.length),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(found.file.name)}`,
      "Content-Security-Policy": SANDBOX_CSP,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "private, no-store",
    },
  });
}
