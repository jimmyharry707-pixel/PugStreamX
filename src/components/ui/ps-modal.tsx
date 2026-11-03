"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PsDialog } from "./ps-dialog";

/**
 * Dialog driven by the URL: render it when a search param is present, and closing it
 * (×, Esc, clicking outside) navigates to `closeHref`. That keeps it linkable and lets the
 * server render its content.
 */
export function PsModal({ title, closeHref, children }: { title: string; closeHref: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <PsDialog title={title} onClose={() => router.push(closeHref, { scroll: false })}>
      {children}
    </PsDialog>
  );
}
