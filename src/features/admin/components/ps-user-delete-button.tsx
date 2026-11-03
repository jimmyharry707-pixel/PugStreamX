"use client";

import { startTransition, useActionState, useEffect } from "react";
import { PsButton } from "@/components/ui/ps-button";
import { confirm } from "@/features/confirm/store";
import { removeUser, type AdminActionResult } from "../actions";

/**
 * Delete button for an account on the Admin pages. Asks for confirmation first. Success goes
 * back to the list with a snackbar; errors are passed to `onResult`.
 */
export function PsUserDeleteButton({
  userId,
  name,
  onResult,
}: {
  userId: string;
  name: string;
  onResult: (result: NonNullable<AdminActionResult>) => void;
}) {
  const [result, action, pending] = useActionState(removeUser, undefined);

  useEffect(() => {
    if (result) onResult(result);
    // Report each result once, not again when the parent passes a new callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  async function onClick() {
    const confirmed = await confirm({
      title: `Delete ${name}?`,
      message: "Their account, profile and photo will be permanently deleted and they'll be signed out. This can't be undone.",
      confirmLabel: "Delete account",
      tone: "danger",
    });
    if (!confirmed) return;
    const formData = new FormData();
    formData.set("userId", userId);
    startTransition(() => action(formData));
  }

  return (
    <PsButton
      type="button"
      size="sm"
      variant="danger"
      disabled={pending}
      onClick={onClick}
      aria-label={`Delete ${name}`}
      className="min-w-24 px-3 py-1.5 text-xs sm:min-w-28"
    >
      {pending ? "Deleting…" : "Delete"}
    </PsButton>
  );
}
