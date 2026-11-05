import { ObjectId } from "mongodb";
import { PsActivityList } from "@/features/account/activity/components/ps-activity-list";
import { listActivitiesPage } from "@/features/account/activity/queries";
import { requireCompleteProfile } from "@/features/account/auth/dal";
import { parsePage } from "@/lib/utils/pagination";

/** The dashboard: the member's own recent activity, newest first. */
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await requireCompleteProfile();
  const params = await searchParams;
  const { items, page } = await listActivitiesPage(new ObjectId(user.id), parsePage(params.page));

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-400">Welcome back, {user.profile?.displayName}.</p>

      <section aria-labelledby="recent-activity" className="mt-8 space-y-3">
        <h2 id="recent-activity" className="text-lg font-semibold">
          Recent activity
        </h2>
        <PsActivityList items={items} page={page} href="/" empty="Nothing yet. What you do on PugStreamX shows up here." />
      </section>
    </div>
  );
}
