import type { ReactNode } from "react";
import { PsSidebarLink } from "@/components/layout/ps-sidebar-link";
import { getCurrentUser } from "@/features/account/auth/dal";
import { seekerAccess } from "../access";

/**
 * The left panel's Seeker link. Disabled for Callers, Developers and accounts without a role
 * (`seekerAccess` mode "none"). Reads the session, so wrap in <Suspense>.
 */
export async function PsSeekerNavItem({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <PsSidebarLink
      href={href}
      label={label}
      icon={icon}
      disabled={!user || seekerAccess(user).mode === "none"}
      disabledHint="For job seekers only"
    />
  );
}
