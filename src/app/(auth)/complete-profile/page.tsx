import type { Metadata } from "next";
import { Suspense } from "react";
import { PsAuthCard } from "@/features/auth/components/ps-auth-card";
import { PsSignOutButton } from "@/features/auth/components/ps-sign-out-button";
import { PsCompleteProfileGuard } from "@/features/profile/components/ps-complete-profile-guard";
import { PsProfileForm } from "@/features/profile/components/ps-profile-form";

export const metadata: Metadata = { title: "Complete your profile" };

export default function CompleteProfilePage() {
  return (
    <>
      <Suspense fallback={null}>
        <PsCompleteProfileGuard />
      </Suspense>
      <PsAuthCard
        wide
        title="Complete your profile"
        description="Tell your team who you are. All fields are required."
        footer={
          <span className="inline-flex items-center gap-3">
            Not you? <PsSignOutButton />
          </span>
        }
      >
        <PsProfileForm />
      </PsAuthCard>
    </>
  );
}
