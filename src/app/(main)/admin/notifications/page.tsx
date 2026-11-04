import type { Metadata } from "next";
import { PsPagination } from "@/components/ui/ps-pagination";
import { requireSuperAdmin } from "@/features/account/auth/dal";
import { PsNotificationManager } from "@/features/communication/notifications/components/ps-notification-manager";
import { ADMIN_NOTIFICATIONS_PATH } from "@/features/communication/notifications/constants";
import { listNotificationsPage } from "@/features/communication/notifications/queries";
import { parsePage } from "@/lib/utils/pagination";

export const metadata: Metadata = { title: "Notifications · Admin" };

export default async function AdminNotificationsPage({ searchParams }: PageProps<"/admin/notifications">) {
  await requireSuperAdmin();
  const params = await searchParams;
  const { items, page } = await listNotificationsPage(parsePage(params.page));

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p className="mt-1 text-sm text-gray-400">
        Announcements for every member. Published ones are in the topbar bell, and pop up when members arrive on the site
        (unless they chose &quot;Don&apos;t show for a day&quot;). Drafts stay here.
      </p>
      <PsNotificationManager notifications={items} />
      <PsPagination {...page} href={ADMIN_NOTIFICATIONS_PATH} label="Notification pages" className="mt-4" />
    </div>
  );
}
