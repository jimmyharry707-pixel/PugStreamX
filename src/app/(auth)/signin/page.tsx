import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PsAuthCard } from "@/features/auth/components/ps-auth-card";
import { PsRedirectIfSignedIn } from "@/features/auth/components/ps-redirect-if-signed-in";
import { PsSignInForm } from "@/features/auth/components/ps-sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <Suspense fallback={null}>
        <PsRedirectIfSignedIn />
      </Suspense>
      <PsAuthCard
        title="Sign in"
        description="Welcome back."
        footer={
          <>
            New to PugStreamX?{" "}
            <Link href="/signup" className="font-medium text-amber-400 hover:underline">Create an account</Link>
          </>
        }
      >
        <PsSignInForm />
      </PsAuthCard>
    </>
  );
}
