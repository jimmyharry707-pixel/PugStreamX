import { redirect } from "next/navigation";
import { ADMIN_USERS_PATH } from "@/features/organization/admin/constants";
import { requireSuperAdmin } from "@/features/account/auth/dal";

// /admin has no page of its own; the Admin popup menu in the left panel lists the admin pages.
export default async function AdminPage() {
  await requireSuperAdmin();
  redirect(ADMIN_USERS_PATH);
}
