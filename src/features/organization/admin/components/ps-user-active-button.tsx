"use client";

import { useActionState, useEffect } from "react";
import { PsButton } from "@/components/ui/ps-button";
import { snackbar } from "@/features/shared/snackbar/store";
import { setUserActive, type AdminActionResult } from "../actions";

/**
 * Activate / Deactivate button for one account on the Admin pages. The result shows as a
 * snackbar, or is passed to `onResult` (inside dialogs, which cover snackbars).
 */
export function PsUserActiveButton({
  userId,
  active,
  name,
  onResult,
}: {
  userId: string;
  active: boolean;
  name: string;
  onResult?: (result: NonNullable<AdminActionResult>) => void;
}) {
  const [result, action, pending] = useActionState(setUserActive, undefined);

  useEffect(() => {
    if (!result) return;
    if (onResult) onResult(result);
    else snackbar[result.ok ? "success" : "error"](result.message);
    // Report each result once, not again when the parent passes a new callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value={String(!active)} />
      <PsButton
        type="submit"
        size="sm"
        variant={active ? "secondary" : "primary"}
        disabled={pending}
        aria-label={`${active ? "Deactivate" : "Activate"} ${name}`}
        className="min-w-24 px-3 py-1.5 text-xs sm:min-w-28"
      >
        {pending ? (active ? "Deactivating…" : "Activating…") : active ? "Deactivate" : "Activate"}
      </PsButton>
    </form>
  );
}
