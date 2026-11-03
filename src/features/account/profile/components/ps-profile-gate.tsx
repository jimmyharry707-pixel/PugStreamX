import type { ReactNode } from "react";
import { requireCompleteProfile } from "@/features/account/auth/dal";

/**
 * Renders its children only for signed-in users with a completed profile; everyone else is
 * redirected (to /signin or /complete-profile). Used by the main-site layout. Wrap in <Suspense>.
 * Pages must still call requireCompleteProfile() themselves (see CLAUDE.md, Authentication).
 */
export async function PsProfileGate({ children }: { children: ReactNode }) {
  await requireCompleteProfile();
  return children;
}
