"use client";

import { useActionState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsSelect } from "@/components/ui/ps-select";
import { setUserGroup } from "@/features/organization/groups/actions";
import type { Group } from "@/features/organization/groups/types";

/** Group picker in a user's profile on the Admin pages. Members of a group share its calendar. */
export function PsUserGroupForm({ userId, groupId, groups }: { userId: string; groupId: string | null; groups: Group[] }) {
  const [result, action, pending] = useActionState(setUserGroup, undefined);

  return (
    // Snackbars sit under open dialogs, so the result is shown here instead.
    <form action={action} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      <PsField id="group" label="Group" hint={groups.length === 0 ? "Create a group in Admin › Groups first." : undefined}>
        {(p) => (
          <PsSelect name="groupId" defaultValue={groupId ?? "none"} disabled={pending} {...p}>
            <option value="none">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </PsSelect>
        )}
      </PsField>
      {result && <PsAlert variant={result.ok ? "success" : "error"}>{result.message}</PsAlert>}
      <PsButton type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save group"}
      </PsButton>
    </form>
  );
}
