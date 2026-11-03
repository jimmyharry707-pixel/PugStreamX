import { requireCompleteProfile } from "@/features/account/auth/dal";

export default async function HomePage() {
  await requireCompleteProfile();

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <h1 className="text-4xl font-bold">Hello World</h1>
    </div>
  );
}
