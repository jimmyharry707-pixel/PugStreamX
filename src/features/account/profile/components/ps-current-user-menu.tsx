import { requireCompleteProfile } from "@/features/account/auth/dal";
import { PsProfileMenu } from "./ps-profile-menu";

/** Topbar profile badge for the signed-in user. Reads the session, so wrap in <Suspense>. */
export async function PsCurrentUserMenu() {
  const user = await requireCompleteProfile();
  // requireCompleteProfile guarantees a profile; the fallback only satisfies the type.
  const profile = user.profile ?? { displayName: user.email, fullName: user.email, avatarUrl: "" };
  return <PsProfileMenu email={user.email} {...profile} />;
}

/** Placeholder with the badge's size, shown while the session loads. */
export function PsCurrentUserMenuSkeleton() {
  return <div aria-hidden className="h-10 w-10 animate-pulse rounded-full bg-gray-800 sm:w-40" />;
}
