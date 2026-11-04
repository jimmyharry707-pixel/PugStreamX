"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type DragEvent } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { snackbar } from "@/features/shared/snackbar/store";
import { WORK_FILE_EXTENSION, WORK_FILE_MAX_BYTES, WORK_FILES_MAX, WORK_RESULTS_API, formatBytes } from "../constants";
import type { UploadResponse } from "../types";

const key = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;
const bids = (n: number) => `${n} ${n === 1 ? "bid" : "bids"}`;

/**
 * Adds a work result: the job seeker picks or drops their `.html` files (each one is a bid), sees
 * the count, and uploads them together to `POST /api/work-results`. The server checks every file
 * again by its bytes; its problems are shown here.
 */
export function PsWorkResultForm() {
  const router = useRouter();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  function add(list: FileList | null) {
    if (!list) return;
    const problems: string[] = [];
    const next = [...files];
    const have = new Set(next.map(key));
    for (const f of Array.from(list)) {
      if (!f.name.toLowerCase().endsWith(WORK_FILE_EXTENSION)) problems.push(`"${f.name}" isn't an ${WORK_FILE_EXTENSION} file.`);
      else if (f.size > WORK_FILE_MAX_BYTES) problems.push(`"${f.name}" is larger than ${formatBytes(WORK_FILE_MAX_BYTES)}.`);
      else if (!have.has(key(f))) {
        have.add(key(f));
        next.push(f);
      }
    }
    if (next.length > WORK_FILES_MAX) problems.push(`At most ${WORK_FILES_MAX} files at once. Upload the rest next.`);
    setFiles(next.slice(0, WORK_FILES_MAX));
    setErrors(problems);
    if (input.current) input.current.value = "";
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    add(event.dataTransfer.files);
  }

  function upload() {
    if (files.length === 0) return;
    startTransition(async () => {
      const body = new FormData();
      for (const f of files) body.append("files", f, f.name);
      let result: UploadResponse;
      try {
        const response = await fetch(WORK_RESULTS_API, { method: "POST", body });
        result = (await response.json()) as UploadResponse;
      } catch {
        result = { ok: false, errors: ["The upload failed. Check your connection and try again."] };
      }
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setFiles([]);
      setErrors([]);
      snackbar.success(`Work result added: ${bids(result.bidCount)}.`);
      router.refresh();
    });
  }

  const size = files.reduce((n, f) => n + f.size, 0);

  return (
    <div className="space-y-4" data-work-result-form>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        data-dragging={dragging || undefined}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 px-4 py-10 text-center transition hover:border-brand-400/60 hover:bg-white/5 data-[dragging]:border-brand-400 data-[dragging]:bg-brand-400/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-8 text-brand-400" aria-hidden>
          <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
        </svg>
        <span className="text-sm font-medium text-gray-100">Drop your {WORK_FILE_EXTENSION} files here, or click to choose</span>
        <span className="text-xs text-gray-400">
          Each saved job page is one bid. Up to {WORK_FILES_MAX} files, {formatBytes(WORK_FILE_MAX_BYTES)} each.
        </span>
        <input
          ref={input}
          id={inputId}
          type="file"
          name="files"
          multiple
          accept=".html,text/html"
          className="sr-only"
          onChange={(e) => add(e.target.files)}
          disabled={pending}
        />
      </label>

      {errors.length > 0 && (
        <PsAlert>
          <ul className="list-disc space-y-0.5 pl-4" data-upload-errors>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </PsAlert>
      )}

      {files.length > 0 && (
        <div className="rounded-2xl border border-white/10">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
            <p className="text-sm text-gray-200" data-selected-count>
              <span className="font-semibold text-gray-100">{bids(files.length)}</span> · {formatBytes(size)}
            </p>
            <button type="button" onClick={() => setFiles([])} disabled={pending} className="text-xs text-gray-400 hover:text-white">
              Clear all
            </button>
          </div>
          <ul className="max-h-60 divide-y divide-white/5 overflow-y-auto">
            {files.map((f) => (
              <li key={key(f)} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-gray-200">{f.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-gray-500">{formatBytes(f.size)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((all) => all.filter((x) => key(x) !== key(f)))}
                  disabled={pending}
                  className="shrink-0 rounded-full p-1 text-gray-500 hover:bg-white/10 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-4" aria-hidden>
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <PsButton type="button" onClick={upload} disabled={pending || files.length === 0}>
          {pending ? "Uploading…" : files.length > 0 ? `Upload ${bids(files.length)}` : "Upload"}
        </PsButton>
      </div>
    </div>
  );
}
