"use client";

import { useState, useTransition, type ReactNode } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsAvatar } from "@/components/ui/ps-avatar";
import { PsBadge } from "@/components/ui/ps-badge";
import { PsButton } from "@/components/ui/ps-button";
import { PsCopyButton } from "@/components/ui/ps-copy-button";
import { timeZoneLabel } from "@/features/scheduling/calendar/time-zone";
import { confirm } from "@/features/shared/confirm/store";
import { removeSchedule } from "../actions";
import { formatScheduleDate, formatShortDate, formatShortDateTime, formatTimeRange, safeUrl } from "../format";
import type { CalendarMode, Schedule } from "../types";
import { useStarted } from "../use-started";
import { PsCallerForm } from "./ps-caller-form";

/** Background classes for the Profile Manager colors (written out so Tailwind finds them). */
const PM_DOT: Record<number, string> = {
  1: "bg-pm-1",
  2: "bg-pm-2",
  3: "bg-pm-3",
  4: "bg-pm-4",
  5: "bg-pm-5",
  6: "bg-pm-6",
  7: "bg-pm-7",
  8: "bg-pm-8",
};

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

/** The schedule's ID with a Copy button (to paste as another schedule's "Linked schedule"). */
function ScheduleId({ uid }: { uid: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <code className="select-all font-mono text-sm tracking-wide text-gray-100">{uid}</code>
      <PsCopyButton text={uid} />
    </span>
  );
}

/**
 * A schedule's details, with Edit and Delete (after the confirm popup). The time is shown in
 * the schedule's own zone and, when that differs, also in the calendar's `timeZone`. Clicking the
 * linked schedule calls `onOpenLinked` (which returns an error message if it can't open);
 * `backTitle` / `onBack` return to the schedule this one was opened from.
 *
 * Everyone who can open it sees every field. `mode` decides the rest: "manage" (Profile Manager)
 * shows Edit and Delete on their own schedules (`schedule.mine`), "call" (Caller) shows the caller form, "support" (Developer) and "view"
 * (super-admin) nothing more.
 */
export function PsScheduleDetails({
  schedule,
  mode,
  timeZone,
  onEdit,
  onCallerSaved,
  onDeleted,
  onOpenLinked,
  backTitle,
  onBack,
}: {
  schedule: Schedule;
  mode: CalendarMode;
  /** The calendar's time zone. */
  timeZone: string;
  onEdit: () => void;
  onCallerSaved: (schedule: Schedule) => void;
  onDeleted: (message: string) => void;
  onOpenLinked: (uid: string) => Promise<string | null>;
  backTitle?: string;
  onBack?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [opening, setOpening] = useState(false);
  const start = new Date(schedule.start);
  const end = new Date(schedule.end);
  const ownZone = schedule.timeZone ?? timeZone;
  const linked = schedule.linked;
  const started = useStarted(schedule.start);

  async function onDelete() {
    const ok = await confirm({
      title: `Delete "${schedule.title}"?`,
      message: "This schedule will be permanently deleted and removed from other schedules' links. This can't be undone.",
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

  async function openLinked(uid: string) {
    setOpening(true);
    setError(await onOpenLinked(uid));
    setOpening(false);
  }

  return (
    <div className="space-y-5">
      {onBack && (
        <button type="button" onClick={onBack} className="-mt-1 flex max-w-full items-center gap-1 text-sm text-gray-400 hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0" aria-hidden>
            <path d="m15 6-6 6 6 6" />
          </svg>
          <span className="truncate">Back to {backTitle}</span>
        </button>
      )}

      <div className="space-y-2 text-sm text-gray-300">
        <p>
          {formatScheduleDate(start, ownZone)}
          <br />
          <span className="text-gray-100">{formatTimeRange(start, end, ownZone)}</span>
          <span className="text-gray-500"> · {timeZoneLabel(ownZone, start)}</span>
        </p>
        {ownZone !== timeZone && (
          <p className="text-xs text-gray-400">
            In your calendar ({timeZoneLabel(timeZone, start)}): {formatScheduleDate(start, timeZone)},{" "}
            {formatTimeRange(start, end, timeZone)}
          </p>
        )}
      </div>

      <dl className="divide-y divide-white/5 rounded-xl border border-white/10 bg-gray-950/40 px-4">
        <Row label="Schedule ID">
          <ScheduleId uid={schedule.uid} />
        </Row>
        {/* Who made it: a group can have several Profile Managers. */}
        <Row label="Profile Manager">
          {schedule.profileManager ? (
            <span data-profile-manager className="flex min-w-0 items-center gap-2">
              <PsAvatar name={schedule.profileManager.fullName} src={schedule.profileManager.avatarUrl} />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-gray-100">
                  <span className="truncate">{schedule.profileManager.fullName}</span>
                  {/* Their color on the calendar. */}
                  <span
                    data-pm-dot={schedule.profileManager.color}
                    title="Their color on the calendar"
                    className={`size-2.5 shrink-0 rounded-full ${PM_DOT[schedule.profileManager.color] ?? "bg-event-400"}`}
                  />
                </span>
                <span className="block truncate text-xs text-gray-500">@{schedule.profileManager.displayName}</span>
              </span>
            </span>
          ) : (
            <span className="text-gray-500">Former member</span>
          )}
        </Row>
        {/* The Caller clicks Done once the screen share link (if required) and their note are in. */}
        <Row label="Status">
          {schedule.doneAt ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <PsBadge variant="success">Done</PsBadge>
              <span className="text-xs text-gray-400">{formatShortDateTime(new Date(schedule.doneAt), timeZone)}</span>
            </span>
          ) : (
            <span className="text-gray-500">Not done yet</span>
          )}
        </Row>
        <Row label="Client company">{schedule.clientCompany}</Row>
        <Row label="Interviewer">{schedule.interviewer}</Row>
        <Row label="Meeting">
          <Link url={schedule.meetingUrl} />
        </Row>
        <Row label="Resume">
          <Link url={schedule.resumeUrl} />
        </Row>
        <Row label="Job description">
          <Link url={schedule.jobDescriptionUrl} />
        </Row>
        <Row label="Screen share">
          {!schedule.screenShareRequired ? (
            <span className="text-gray-500">Not required</span>
          ) : schedule.screenShareUrl ? (
            <Link url={schedule.screenShareUrl} />
          ) : started ? (
            // Too late to add it now (the Caller can't once the interview has started).
            <span className="text-gray-500">Not added</span>
          ) : (
            // Required, but the Caller hasn't added the link yet.
            <PsBadge variant="danger">Required</PsBadge>
          )}
        </Row>
        <Row label="Tech supporter">
          {schedule.techSupportRequired ? <PsBadge variant="info">Needed</PsBadge> : <span className="text-gray-500">Not needed</span>}
        </Row>
        <Row label="Linked schedules">
          {linked.length > 0 ? (
            <ul className="space-y-2">
              {linked.map((item) => (
                <li key={item.uid}>
                  <button
                    type="button"
                    onClick={() => openLinked(item.uid)}
                    disabled={opening}
                    className="group flex max-w-full flex-col items-start rounded-md text-left disabled:opacity-60"
                  >
                    <span className="text-brand-300 underline-offset-2 group-hover:underline">{item.title}</span>
                    <span className="text-xs text-gray-400">
                      {formatShortDate(new Date(item.start), timeZone)}, {formatTimeRange(new Date(item.start), new Date(item.end), timeZone)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </Row>
        <Row label="Note">
          {schedule.note ? <span className="whitespace-pre-line">{schedule.note}</span> : <span className="text-gray-500">—</span>}
        </Row>
        <Row label="Note (Caller)">
          {schedule.callerNote ? <span className="whitespace-pre-line">{schedule.callerNote}</span> : <span className="text-gray-500">—</span>}
        </Row>
      </dl>

      {error && <PsAlert>{error}</PsAlert>}

      {mode === "call" && <PsCallerForm key={schedule.id} schedule={schedule} onSaved={onCallerSaved} />}

      {mode === "manage" && !schedule.mine && (
        // A group can have several Profile Managers; each changes only their own schedules.
        <p data-not-mine className="text-right text-xs text-gray-500">
          Only {schedule.profileManager?.fullName ?? "the Profile Manager who made it"} can change this schedule.
        </p>
      )}

      {mode === "manage" && schedule.mine && (
        <div className="flex flex-wrap justify-end gap-2">
          <PsButton type="button" variant="danger" size="sm" onClick={onDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </PsButton>
          <PsButton type="button" variant="secondary" size="sm" onClick={onEdit} disabled={pending}>
            Edit
          </PsButton>
        </div>
      )}
    </div>
  );
}
