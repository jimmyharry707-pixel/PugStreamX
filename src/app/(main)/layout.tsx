import { Suspense } from "react";
import { PsAppShell } from "@/components/layout/ps-app-shell";
import { PsSidebarLink } from "@/components/layout/ps-sidebar-link";
import { PsSidebarNav } from "@/components/layout/ps-sidebar-nav";
import { PsInvoicesNavItem } from "@/features/finance/invoices/components/ps-invoices-nav-item";
import { INVOICES_PATH } from "@/features/finance/invoices/constants";
import { PsChatUnreadBadge } from "@/features/communication/chat/components/ps-chat-unread-badge";
import { PsNotificationBell } from "@/features/communication/notifications/components/ps-notification-bell";
import { CHAT_PATH } from "@/features/communication/chat/constants";
import { PsAdminNavItem } from "@/features/organization/admin/components/ps-admin-nav-item";
import { PsCurrentUserMenu, PsCurrentUserMenuSkeleton } from "@/features/account/profile/components/ps-current-user-menu";
import { PsProfileGate } from "@/features/account/profile/components/ps-profile-gate";

// Everything in (main) is the main site: signed-in users with a completed profile only.
// The frame (left panel, topbar) is static and prerendered; only the role-based Admin link and
// Invoices item, the profile badge and the page content wait for the session, and the last two
// redirect anyone who isn't allowed in.
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <PsAppShell
      sidebar={
        <PsSidebarNav
          badges={{ [CHAT_PATH]: <PsChatUnreadBadge /> }}
          slots={{
            // Founders review invoices in Admin › Invoices, so theirs is disabled.
            [INVOICES_PATH]: (item) => (
              <Suspense fallback={<PsSidebarLink {...item} />}>
                <PsInvoicesNavItem {...item} />
              </Suspense>
            ),
          }}
          adminItem={
            <Suspense fallback={null}>
              <PsAdminNavItem />
            </Suspense>
          }
        />
      }
      topbarEnd={
        <>
          <Suspense fallback={null}>
            <PsNotificationBell />
          </Suspense>
          <Suspense fallback={<PsCurrentUserMenuSkeleton />}>
            <PsCurrentUserMenu />
          </Suspense>
        </>
      }
    >
      <Suspense fallback={null}>
        <PsProfileGate>{children}</PsProfileGate>
      </Suspense>
    </PsAppShell>
  );
}
