import { Suspense } from "react";
import { PsSignOutButton } from "@/features/auth/components/ps-sign-out-button";
import { requireUser } from "@/features/auth/dal";

export default function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Suspense fallback={null}>
        <Hello />
      </Suspense>
    </div>
  );
}

async function Hello() {
  await requireUser();

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <PsSignOutButton />
    </div>
  );
}
