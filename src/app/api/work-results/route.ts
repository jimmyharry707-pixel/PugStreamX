import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/features/account/auth/dal";
import { seekerAccess } from "@/features/work/seeker/access";
import { WORK_FILE_EXTENSION, WORK_FILES_MAX, WORK_UPLOAD_MAX_BYTES, formatBytes } from "@/features/work/seeker/constants";
import { createWorkResult } from "@/features/work/seeker/mutations";
import { uploadedHashes } from "@/features/work/seeker/queries";
import type { UploadResponse } from "@/features/work/seeker/types";
import { checkHtmlFile, cleanFileName } from "@/features/work/seeker/validation";

/** At most this many problems are listed; the rest are counted. */
const ERRORS_SHOWN = 10;

const fail = (errors: string[], status = 400) => {
  const shown = errors.length > ERRORS_SHOWN ? [...errors.slice(0, ERRORS_SHOWN), `…and ${errors.length - ERRORS_SHOWN} more.`] : errors;
  return Response.json({ ok: false, errors: shown } satisfies UploadResponse, { status });
};

// POST /api/work-results: a job seeker uploads one work result, its `.html` files under `files`
// (multipart). Each file is one bid. A route handler rather than a server action, because server
// actions take at most 1 MB. All or nothing: if any file is refused, nothing is saved.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return fail(["Sign in again to upload."], 401);
  if (seekerAccess(user).mode !== "upload") return fail(["Only job seekers can upload work results."], 403);

  // Only from this site's own pages (the session cookie is SameSite=Lax, this is a second guard).
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return fail(["Upload from the Seeker page."], 403);

  if (Number(request.headers.get("content-length") ?? 0) > WORK_UPLOAD_MAX_BYTES + 1024 * 1024) {
    return fail([`The files are larger than ${formatBytes(WORK_UPLOAD_MAX_BYTES)} together. Upload them in parts.`], 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(["The upload couldn't be read. Try again."]);
  }
  const uploads = form.getAll("files").filter((f): f is File => f instanceof File);
  if (uploads.length === 0) return fail([`Choose at least one ${WORK_FILE_EXTENSION} file.`]);
  if (uploads.length > WORK_FILES_MAX) return fail([`At most ${WORK_FILES_MAX} files at once. Upload them in parts.`]);

  const errors: string[] = [];
  const files: { name: string; bytes: Uint8Array; sha256: string }[] = [];
  const seen = new Map<string, string>();
  let total = 0;
  for (const upload of uploads) {
    const name = cleanFileName(upload.name);
    const bytes = new Uint8Array(await upload.arrayBuffer());
    total += bytes.length;
    const problem = checkHtmlFile(name, bytes);
    if (problem) {
      errors.push(problem);
      continue;
    }
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const twin = seen.get(sha256);
    if (twin) {
      errors.push(`"${name}" is the same page as "${twin}".`);
      continue;
    }
    seen.set(sha256, name);
    files.push({ name, bytes, sha256 });
  }
  if (total > WORK_UPLOAD_MAX_BYTES) return fail([`The files are larger than ${formatBytes(WORK_UPLOAD_MAX_BYTES)} together. Upload them in parts.`], 413);

  const userId = new ObjectId(user.id);
  const already = await uploadedHashes(userId, files.map((f) => f.sha256));
  for (const f of files) if (already.has(f.sha256)) errors.push(`"${f.name}" was already uploaded.`);
  if (errors.length > 0) return fail(errors);

  const doc = await createWorkResult(userId, files);
  return Response.json({ ok: true, bidCount: doc.bidCount } satisfies UploadResponse, { headers: { "Cache-Control": "no-store" } });
}
