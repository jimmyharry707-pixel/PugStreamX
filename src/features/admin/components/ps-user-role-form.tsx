"use client";

import { useActionState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsSelect } from "@/components/ui/ps-select";
import { ROLE_OPTIONS } from "@/features/users/roles";
import { setUserRole } from "../actions";

/** Role picker in a user's profile on the Admin pages. Disabled for your own account. */
export function PsUserRoleForm({ userId, role, isSelf }: { userId: string; role: number | null; isSelf: boolean }) {
  const [result, action, pending] = useActionState(setUserRole, undefined);

  return (
    // Snackbars sit under open dialogs, so the result is shown here instead.
    <form action={action} className="space-y-3">
      <input type="hidden" name="userId" value={userId} />
      <PsField id="role" label="Role" hint={isSelf ? "You can't change your own role." : undefined}>
        {(p) => (
          <PsSelect name="role" defaultValue={role === null ? "none" : String(role)} disabled={isSelf || pending} {...p}>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.label} value={o.value === null ? "none" : String(o.value)}>
                {o.value === null ? o.label : `${o.value} · ${o.label}`}
              </option>
            ))}
          </PsSelect>
        )}
      </PsField>
      {result && <PsAlert variant={result.ok ? "success" : "error"}>{result.message}</PsAlert>}
      {!isSelf && (
        <PsButton type="submit" size="sm" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Save role"}
        </PsButton>
      )}
    </form>
  );
}
