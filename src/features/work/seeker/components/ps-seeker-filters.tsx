"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PsField } from "@/components/ui/ps-field";
import { PsSelect } from "@/components/ui/ps-select";
import { NO_GROUP, seekerHref } from "../constants";

/**
 * The Seeker page's pickers: a group (founders only, when `groups` is given) and a job seeker.
 * Choosing one goes to that view (back to page 1). Changing the group clears the job seeker.
 */
export function PsSeekerFilters({
  groups,
  group,
  seekers,
  seeker,
}: {
  groups?: { id: string; name: string }[];
  group: string | null;
  seekers: { displayName: string; fullName: string }[];
  seeker: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (href: string) => startTransition(() => router.push(href, { scroll: false }));

  return (
    <div className="grid gap-3 sm:grid-cols-2" data-seeker-filters data-pending={pending || undefined}>
      {groups && (
        <PsField id="seeker-group" label="Group">
          {(p) => (
            <PsSelect {...p} name="group" value={group ?? ""} onChange={(e) => go(seekerHref({ group: e.target.value || null }))}>
              <option value="">All groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
              <option value={NO_GROUP}>No group</option>
            </PsSelect>
          )}
        </PsField>
      )}
      <PsField id="seeker-person" label="Job seeker">
        {(p) => (
          <PsSelect {...p} name="seeker" value={seeker ?? ""} onChange={(e) => go(seekerHref({ group, seeker: e.target.value || null }))}>
            <option value="">All job seekers ({seekers.length})</option>
            {seekers.map((s) => (
              <option key={s.displayName} value={s.displayName}>
                {s.fullName} (@{s.displayName})
              </option>
            ))}
          </PsSelect>
        )}
      </PsField>
    </div>
  );
}
