"use client";

import { useState, useTransition } from "react";
import { PsButton } from "@/components/ui/ps-button";
import { PsDialog } from "@/components/ui/ps-dialog";
import { PsTable, PsTableBody, PsTableCell, PsTableHead, PsTableHeaderCell, PsTableRow } from "@/components/ui/ps-table";
import { confirm } from "@/features/confirm/store";
import { snackbar } from "@/features/snackbar/store";
import { removeGroup } from "../actions";
import type { Group, GroupListItem } from "../types";
import { PsGroupForm } from "./ps-group-form";

/**
 * Admin > Groups: the list of groups with "New group", and Rename / Delete per group. New and
 * Rename open a popup; Delete asks first and only works for empty groups.
 */
export function PsGroupManager({ groups }: { groups: GroupListItem[] }) {
  const [editing, setEditing] = useState<{ group?: Group } | null>(null);
  const [pending, startTransition] = useTransition();

  async function onDelete(group: GroupListItem) {
    const ok = await confirm({
      title: `Delete "${group.name}"?`,
      message: "The group will be permanently deleted. This can't be undone.",
      confirmLabel: "Delete group",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await removeGroup(group.id);
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
          New group
        </PsButton>
      </div>

      <div className="mt-4">
        {groups.length > 0 ? (
          <PsTable label="Groups" stack>
            <PsTableHead>
              <PsTableRow>
                <PsTableHeaderCell>Group</PsTableHeaderCell>
                <PsTableHeaderCell hideBelow="sm">Members</PsTableHeaderCell>
                <PsTableHeaderCell hideBelow="sm">Schedules</PsTableHeaderCell>
                <PsTableHeaderCell align="end">
                  <span className="sr-only">Actions</span>
                </PsTableHeaderCell>
              </PsTableRow>
            </PsTableHead>
            <PsTableBody>
              {groups.map((group) => (
                <PsTableRow key={group.id} data-group-id={group.id}>
                  <PsTableCell grow stack="full">
                    <p className="truncate font-medium text-gray-100">{group.name}</p>
                    <p className="text-xs text-gray-400 sm:hidden">
                      {group.memberCount} members · {group.scheduleCount} schedules
                    </p>
                  </PsTableCell>
                  <PsTableCell hideBelow="sm" className="text-gray-300">
                    {group.memberCount}
                  </PsTableCell>
                  <PsTableCell hideBelow="sm" className="text-gray-300">
                    {group.scheduleCount}
                  </PsTableCell>
                  <PsTableCell stack="full" align="end" className="max-sm:pt-3">
                    <div className="flex justify-end gap-2">
                      <PsButton variant="secondary" size="sm" onClick={() => setEditing({ group })} className="px-3 py-1.5 text-xs">
                        Rename
                      </PsButton>
                      <PsButton variant="danger" size="sm" onClick={() => onDelete(group)} disabled={pending} className="px-3 py-1.5 text-xs">
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
            No groups yet. Create one, then put members in it from Admin › Users.
          </p>
        )}
      </div>

      {editing && (
        <PsDialog title={editing.group ? "Rename group" : "New group"} size="sm" onClose={() => setEditing(null)} initialFocus='input[name="name"]'>
          <PsGroupForm
            group={editing.group}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              snackbar.success(editing.group ? "Group renamed." : "Group created.");
            }}
          />
        </PsDialog>
      )}
    </>
  );
}
