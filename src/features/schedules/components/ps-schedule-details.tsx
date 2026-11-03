"use client";

import { useState, useTransition, type ReactNode } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { confirm } from "@/features/confirm/store";
import { removeSchedule } from "../actions";
import { formatScheduleDate, formatTimeRange, safeUrl } from "../format";
import type { Schedule } from "../types";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-gray-200">{children}</dd>
    </div>
  );
}

function Link({ url }: { url: string | null }) {
  const href = safeUrl(url);
  if (!href) return <span className="text-gray-500">—</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-brand-300 underline-offset-2 hover:underline">
      {href}
    </a>
  );
}

/** A schedule's details, with Edit and Delete (after the confirm popup). */
export function PsScheduleDetails({
  schedule,
  timeZone,
  zoneLabel,
  onEdit,
  onDeleted,
}: {
  schedule: Schedule;
  timeZone: string;
  zoneLabel: string;
  onEdit: () => void;
  onDeleted: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const start = new Date(schedule.start);
  const end = new Date(schedule.end);

  async function onDelete() {
    const ok = await confirm({
      title: `Delete "${schedule.title}"?`,
      message: "This schedule will be permanently deleted. This can't be undone.",
      confirmLabel: "Delete schedule",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await removeSchedule(schedule.id);
      if (result.ok) onDeleted(result.message);
      else setError(result.message);
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-300">
        {formatScheduleDate(start, timeZone)}
        <br />
        <span className="text-gray-100">{formatTimeRange(start, end, timeZone)}</span>
        <span className="text-gray-500"> · {zoneLabel}</span>
      </p>

      <dl className="divide-y divide-white/5 rounded-xl border border-white/10 bg-gray-950/40 px-4">
        <Row label="Client company">{schedule.clientCompany}</Row>
        <Row label="Interviewer">{schedule.interviewer}</Row>
        <Row label="Resume">
          <Link url={schedule.resumeUrl} />
        </Row>
        <Row label="Job description">
          <Link url={schedule.jobDescriptionUrl} />
        </Row>
        <Row label="Screen share">
          <Link url={schedule.screenShareUrl} />
        </Row>
        <Row label="Note">
          {schedule.note ? <span className="whitespace-pre-line">{schedule.note}</span> : <span className="text-gray-500">—</span>}
        </Row>
      </dl>

      {error && <PsAlert>{error}</PsAlert>}

      <div className="flex flex-wrap justify-end gap-2">
        <PsButton type="button" variant="danger" size="sm" onClick={onDelete} disabled={pending}>
          {pending ? "Deleting…" : "Delete"}
        </PsButton>
        <PsButton type="button" variant="secondary" size="sm" onClick={onEdit} disabled={pending}>
          Edit
        </PsButton>
      </div>
    </div>
  );
}
