"use client";

import { useSyncExternalStore } from "react";
import { PsButton } from "@/components/ui/ps-button";
import { PsDialog } from "@/components/ui/ps-dialog";
import { getServerSnapshot, getSnapshot, settle, subscribe } from "../store";

/**
 * The global confirm dialog. Mount once, in the root layout. Open it from client code with
 * `confirm({ ... })` from "@/features/shared/confirm/store".
 */
export function PsConfirmRoot() {
  const request = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!request) return null;

  const { id, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "default" } = request;
  return (
    <PsDialog
      key={id}
      role="alertdialog"
      layer="confirm"
      size="sm"
      title={title}
      description={message}
      onClose={() => settle(id, false)}
      // Start on the safe choice for destructive actions.
      initialFocus={tone === "danger" ? "[data-confirm-cancel]" : "[data-confirm-ok]"}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <PsButton data-confirm-cancel variant="secondary" size="sm" onClick={() => settle(id, false)}>
          {cancelLabel}
        </PsButton>
        <PsButton data-confirm-ok variant={tone === "danger" ? "danger" : "primary"} size="sm" onClick={() => settle(id, true)}>
          {confirmLabel}
        </PsButton>
      </div>
    </PsDialog>
  );
}
