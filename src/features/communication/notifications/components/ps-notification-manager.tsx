"use client";

import { useState, useTransition } from "react";
import { PsBadge } from "@/components/ui/ps-badge";
import { PsButton } from "@/components/ui/ps-button";
import { PsDialog } from "@/components/ui/ps-dialog";
import { PsTable, PsTableBody, PsTableCell, PsTableHead, PsTableHeaderCell, PsTableRow } from "@/components/ui/ps-table";
import { confirm } from "@/features/shared/confirm/store";
import { snackbar } from "@/features/shared/snackbar/store";
import { removeNotification } from "../actions";
import type { Notification } from "../types";
import { PsNotificationForm } from "./ps-notification-form";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

/**
 * Admin › Notifications: one page of notifications with "New notification", and Edit / Delete
 * per row. New and Edit open a popup; Delete asks first.
 */
export function PsNotificationManager({ notifications }: { notifications: Notification[] }) {
  const [editing, setEditing] = useState<{ notification?: Notification } | null>(null);
  const [pending, startTransition] = useTransition();

  async function onDelete(notification: Notification) {
    const ok = await confirm({
      title: `Delete "${notification.title}"?`,
      message: "Members will no longer see it. This can't be undone.",
      confirmLabel: "Delete notification",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await removeNotification(notification.id);
      if (result.ok) snackbar.success(result.message);
      else snackbar.error(result.message);
    });
  }

  return (
    <>
      <div className="mt-6 flex justify-end">
        <PsButton size="sm" onClick={() => setEditing({})} className="gap-1.5 pl-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" className="size-4" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          New notification
        </PsButton>
      </div>

      <div className="mt-4">
        {notifications.length > 0 ? (
          <PsTable label="Notifications" stack>
            <PsTableHead>
              <PsTableRow>
                <PsTableHeaderCell>Notification</PsTableHeaderCell>
                <PsTableHeaderCell>Status</PsTableHeaderCell>
                <PsTableHeaderCell hideBelow="md">Created</PsTableHeaderCell>
                <PsTableHeaderCell align="end">
                  <span className="sr-only">Actions</span>
                </PsTableHeaderCell>
              </PsTableRow>
            </PsTableHead>
            <PsTableBody>
              {notifications.map((n) => (
                <PsTableRow key={n.id} data-notification-id={n.id}>
                  <PsTableCell grow stack="full">
                    <p className="truncate font-medium text-gray-100">{n.title}</p>
                    <p className="truncate text-xs text-gray-400">{n.message}</p>
                  </PsTableCell>
                  <PsTableCell stack="fill">
                    {n.published ? <PsBadge variant="success">Published</PsBadge> : <PsBadge>Draft</PsBadge>}
                  </PsTableCell>
                  <PsTableCell hideBelow="md" className="whitespace-nowrap text-gray-400">
                    <time dateTime={n.createdAt}>{dateFormat.format(new Date(n.createdAt))}</time>
                  </PsTableCell>
                  <PsTableCell stack="auto" align="end">
                    <div className="flex justify-end gap-2">
                      <PsButton variant="secondary" size="sm" onClick={() => setEditing({ notification: n })} className="px-3 py-1.5 text-xs">
                        Edit
                      </PsButton>
                      <PsButton variant="danger" size="sm" onClick={() => onDelete(n)} disabled={pending} className="px-3 py-1.5 text-xs">
                        Delete
                      </PsButton>
                    </div>
                  </PsTableCell>
                </PsTableRow>
              ))}
            </PsTableBody>
          </PsTable>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-gray-400">
            No notifications yet. Write one, and members will see it when they arrive on the site.
          </p>
        )}
      </div>

      {editing && (
        <PsDialog title={editing.notification ? "Edit notification" : "New notification"} onClose={() => setEditing(null)} initialFocus='input[name="title"]'>
          <PsNotificationForm
            notification={editing.notification}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              snackbar.success(editing.notification ? "Notification saved." : "Notification created.");
            }}
          />
        </PsDialog>
      )}
    </>
  );
}
