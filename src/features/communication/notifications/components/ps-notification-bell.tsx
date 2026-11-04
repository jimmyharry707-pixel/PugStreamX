import { getCurrentUser } from "@/features/account/auth/dal";
import { listPublishedNotifications } from "../queries";
import { PsNotificationCenter } from "./ps-notification-center";

/**
 * The topbar's notification bell for signed-in members with a complete profile. Reads the
 * session, so wrap in <Suspense>. The list itself is cached for everyone.
 */
export async function PsNotificationBell() {
  const user = await getCurrentUser();
  if (!user?.profileComplete) return null;
  return <PsNotificationCenter notifications={await listPublishedNotifications()} />;
}
