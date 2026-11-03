import { redirect } from "next/navigation";
import { HOME_PATH } from "@/features/auth/constants";
import { requireUser } from "@/features/auth/dal";

/**
 * For /complete-profile: sends signed-out visitors to sign in, and people whose profile is already
 * complete to the main site. Renders nothing. Wrap in <Suspense> so the page shell can prerender.
 */
export async function PsCompleteProfileGuard() {
  const user = await requireUser();
  if (user.profileComplete) redirect(HOME_PATH);
  return null;
}
