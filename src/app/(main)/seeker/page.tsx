import { ObjectId } from "mongodb";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsEmptyState } from "@/components/ui/ps-empty-state";
import { PsModal } from "@/components/ui/ps-modal";
import { PsPagination } from "@/components/ui/ps-pagination";
import { PsStat } from "@/components/ui/ps-stat";
import { requireCompleteProfile } from "@/features/account/auth/dal";
import { seekerAccess } from "@/features/work/seeker/access";
import { PsSeekerSummaryTable } from "@/features/work/seeker/components/ps-seeker-summary-table";
import { PsWorkResultFiles } from "@/features/work/seeker/components/ps-work-result-files";
import { PsWorkResultForm } from "@/features/work/seeker/components/ps-work-result-form";
import { PsWorkResultTable } from "@/features/work/seeker/components/ps-work-result-table";
import { RESULT_PARAM, SEEKER_PATH, seekerHref } from "@/features/work/seeker/constants";
import { findWorkResult, listGroupWorkResults, listWorkResults, type WorkResultViewer } from "@/features/work/seeker/queries";
import type { WorkResult } from "@/features/work/seeker/types";
import { parsePage } from "@/lib/utils/pagination";

export const metadata: Metadata = { title: "Seeker" };

function Frame({ intro, children }: { intro: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Seeker</h1>
        <p className="mt-1 text-sm text-gray-400">{intro}</p>
      </div>
      {children}
    </div>
  );
}

const Empty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-gray-400">{children}</p>
);

const count = (n: number) => n.toLocaleString("en-US");

export default async function SeekerPage({ searchParams }: PageProps<"/seeker">) {
  const user = await requireCompleteProfile();
  const access = seekerAccess(user);

  if (access.mode === "soon") {
    return (
      <PsEmptyState emoji="🚧" title="Coming soon">
        The Seeker page for founders is on its way.
      </PsEmptyState>
    );
  }
  if (access.mode === "none" || (access.mode === "group" && !access.groupId)) {
    return (
      <Frame intro="Job seekers' bids and work results.">
        <div className="max-w-xl">
          <PsAlert variant="info">
            {access.mode === "group" ? "You're not in a group yet, so there are no job seekers to show. An admin can add you to one." : "This page is for job seekers."}
          </PsAlert>
        </div>
      </Frame>
    );
  }

  const params = await searchParams;
  const requestedPage = parsePage(params.page);
  const selectedId = typeof params[RESULT_PARAM] === "string" && ObjectId.isValid(params[RESULT_PARAM]) ? params[RESULT_PARAM] : null;
  const viewer: WorkResultViewer = access.mode === "upload" ? { userId: new ObjectId(user.id) } : { groupId: new ObjectId(access.groupId!) };
  const selectedPromise = selectedId ? findWorkResult(new ObjectId(selectedId), viewer) : Promise.resolve(null);

  let content: ReactNode;
  let pageNumber: number;
  if (access.mode === "group") {
    // A Profile Manager: the bids of the job seekers in their group.
    const { seekers, totals, items, page } = await listGroupWorkResults(new ObjectId(access.groupId!), requestedPage);
    pageNumber = page.page;
    content = (
      <Frame intro="The bids of the job seekers in your group. Open a work result to see the job pages they uploaded.">
        <div className="grid grid-cols-2 gap-3">
          <PsStat label="Total bids" tone="success" value={count(totals.bids)} detail={`${count(totals.results)} work results`} />
          <PsStat label="Job seekers" value={count(seekers.length)} detail="in your group" />
        </div>
        <section aria-labelledby="seekers-heading" className="space-y-4">
          <h2 id="seekers-heading" className="text-lg font-semibold">
            Job seekers
          </h2>
          {seekers.length > 0 ? <PsSeekerSummaryTable seekers={seekers} /> : <Empty>There are no job seekers in your group yet.</Empty>}
        </section>
        <section aria-labelledby="bids-heading" className="space-y-4">
          <h2 id="bids-heading" className="text-lg font-semibold">
            Bid counts
          </h2>
          {items.length > 0 ? (
            <>
              <PsWorkResultTable results={items} showSeeker detailsHref={(id) => seekerHref({ page: page.page, result: id })} />
              <PsPagination {...page} href={SEEKER_PATH} label="Work result pages" />
            </>
          ) : (
            <Empty>No work results yet.</Empty>
          )}
        </section>
      </Frame>
    );
  } else {
    // A job seeker: their own bids, and the upload form.
    const { items, page, totals } = await listWorkResults(new ObjectId(user.id), requestedPage);
    pageNumber = page.page;
    content = (
      <Frame intro="Add your work results: upload the job pages you bid on, saved as .html files. Each file counts as one bid.">
        <div className="grid grid-cols-2 gap-3">
          <PsStat label="Total bids" tone="success" value={count(totals.bids)} detail="all your uploaded pages" />
          <PsStat label="Work results" value={count(totals.results)} detail="uploads" />
        </div>
        <section aria-labelledby="add-heading" className="rounded-2xl border border-white/10 bg-gray-900 p-4 sm:p-6">
          <h2 id="add-heading" className="mb-4 text-lg font-semibold">
            Add a work result
          </h2>
          <PsWorkResultForm />
        </section>
        <section aria-labelledby="bids-heading" className="space-y-4">
          <h2 id="bids-heading" className="text-lg font-semibold">
            Bid counts
          </h2>
          {items.length > 0 ? (
            <>
              <PsWorkResultTable results={items} detailsHref={(id) => seekerHref({ page: page.page, result: id })} />
              <PsPagination {...page} href={SEEKER_PATH} label="Work result pages" />
            </>
          ) : (
            <Empty>No work results yet. Upload your first .html files above.</Empty>
          )}
        </section>
      </Frame>
    );
  }

  const selected: WorkResult | null = await selectedPromise;
  return (
    <>
      {content}
      {selected && (
        <PsModal title="Work result" closeHref={seekerHref({ page: pageNumber })}>
          <PsWorkResultFiles result={selected} />
        </PsModal>
      )}
    </>
  );
}
