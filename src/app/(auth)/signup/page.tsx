import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PsAuthCard } from "@/features/account/auth/components/ps-auth-card";
import { PsRedirectIfSignedIn } from "@/features/account/auth/components/ps-redirect-if-signed-in";
import { PsSignUpForm } from "@/features/account/auth/components/ps-sign-up-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <>
      <Suspense fallback={null}>
        <PsRedirectIfSignedIn />
      </Suspense>
      <PsAuthCard
        title="Create your account"
        description="Join PugStreamX with your email."
        footer={
          <>
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-brand-400 hover:underline">Sign in</Link>
          </>
        }
      >
        <PsSignUpForm />
      </PsAuthCard>
    </>
  );
}
