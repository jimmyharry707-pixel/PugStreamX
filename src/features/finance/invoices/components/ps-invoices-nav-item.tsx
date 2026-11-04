import type { ReactNode } from "react";
import { PsSidebarLink } from "@/components/layout/ps-sidebar-link";
import { getCurrentUser } from "@/features/account/auth/dal";

/**
 * The left panel's Invoices link. Founders don't send invoices (they review them in
 * Admin › Invoices), so for them it's disabled. Reads the session, so wrap in <Suspense>.
 */
export async function PsInvoicesNavItem({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <PsSidebarLink
      href={href}
      label={label}
      icon={icon}
      disabled={!!user?.isSuperAdmin}
      disabledHint="Founders review invoices in Admin › Invoices"
    />
  );
}
