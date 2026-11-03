"use client";

import { useActionState, useEffect } from "react";
import { PsButton } from "@/components/ui/ps-button";
import { PsFormField } from "@/components/ui/ps-form-field";
import { saveGroup } from "../actions";
import { GROUP_NAME_MAX } from "../constants";
import type { Group } from "../types";

/** Create a group, or rename `group`. Calls `onSaved` once saved. */
export function PsGroupForm({ group, onSaved, onCancel }: { group?: Group; onSaved: () => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState(saveGroup, undefined);

  useEffect(() => {
    if (state?.saved) onSaved();
    // Only when a save finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} noValidate className="space-y-4">
      {group && <input type="hidden" name="groupId" value={group.id} />}
      <PsFormField
        label="Group name"
        name="name"
        required
        maxLength={GROUP_NAME_MAX}
        autoComplete="off"
        defaultValue={state?.values?.name ?? group?.name}
        errors={state?.errors?.name}
      />
      <div className="flex justify-end gap-2">
        <PsButton type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </PsButton>
        <PsButton type="submit" size="sm" disabled={pending} className="min-w-24">
          {pending ? "Saving…" : group ? "Save" : "Create group"}
        </PsButton>
      </div>
    </form>
  );
}
