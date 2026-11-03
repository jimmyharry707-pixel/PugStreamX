import { PsSidebarMenu } from "@/components/layout/ps-sidebar-menu";
import { getCurrentUser } from "@/features/account/auth/dal";
import { ADMIN_NAV_ITEMS, ADMIN_PATH } from "../constants";

/** "Admin" popup menu in the left panel, shown only to super-admins. Reads the session, so wrap in <Suspense>. */
export async function PsAdminNavItem() {
  const user = await getCurrentUser();
  if (!user?.isSuperAdmin) return null;

  return (
    <PsSidebarMenu
      label="Admin"
      basePath={ADMIN_PATH}
      items={ADMIN_NAV_ITEMS}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0" aria-hidden>
          <path d="M12 3.5 5 6v5.5c0 4.2 3 7.7 7 9 4-1.3 7-4.8 7-9V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      }
    />
  );
}
