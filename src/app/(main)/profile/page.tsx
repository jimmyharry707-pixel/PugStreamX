import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireCompleteProfile } from "@/features/account/auth/dal";
import { PsProfileForm } from "@/features/account/profile/components/ps-profile-form";
import { COMPLETE_PROFILE_PATH } from "@/features/account/profile/constants";
import { getProfileForEditing } from "@/features/account/profile/queries";

export const metadata: Metadata = { title: "Update profile" };

export default async function ProfilePage() {
  const user = await requireCompleteProfile();
  const initial = await getProfileForEditing(user.id);
  if (!initial) redirect(COMPLETE_PROFILE_PATH);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Update profile</h1>
      <p className="mt-1 text-sm text-gray-400">Keep your details up to date for your team. All fields are required.</p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-gray-900 p-5 sm:p-8">
        {/* Remount after each save so the form starts from the newly saved values. */}
        <PsProfileForm key={initial.version} mode="update" initial={initial} />
      </div>
    </div>
  );
}
