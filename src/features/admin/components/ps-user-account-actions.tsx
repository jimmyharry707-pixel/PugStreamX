"use client";

import { useState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import type { AdminActionResult } from "../actions";
import { PsUserActiveButton } from "./ps-user-active-button";
import { PsUserDeleteButton } from "./ps-user-delete-button";

/**
 * The account's Activate/Deactivate and Delete buttons, side by side, with one message line
 * below for their results (snackbars would sit under the dialog).
 */
export function PsUserAccountActions({
  userId,
  name,
  active,
  canChangeActive,
  canDelete,
}: {
  userId: string;
  name: string;
  active: boolean;
  canChangeActive: boolean;
  canDelete: boolean;
}) {
  const [result, setResult] = useState<NonNullable<AdminActionResult> | null>(null);

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <p className="text-sm text-zinc-400">
        {active ? "This account can sign in." : "This account can't sign in until you activate it."}
        {canDelete && " Deleting removes the account, its profile and photo permanently."}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {canChangeActive && <PsUserActiveButton userId={userId} active={active} name={name} onResult={setResult} />}
        {canDelete && <PsUserDeleteButton userId={userId} name={name} onResult={setResult} />}
      </div>
      {result && <PsAlert variant={result.ok ? "success" : "error"}>{result.message}</PsAlert>}
    </div>
  );
}
