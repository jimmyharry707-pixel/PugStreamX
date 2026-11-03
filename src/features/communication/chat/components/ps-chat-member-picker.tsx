"use client";

import { useState } from "react";
import { PsAvatar } from "@/components/ui/ps-avatar";
import { PsBadge } from "@/components/ui/ps-badge";
import { PsDialog } from "@/components/ui/ps-dialog";
import { PsInput } from "@/components/ui/ps-input";
import type { ChatMember } from "../types";

type Section = { key: string; title: string; members: ChatMember[] };

/** Founders first, then each group by name, then members without a group. Empty sections are left out. */
function toSections(members: ChatMember[]): Section[] {
  const founders: ChatMember[] = [];
  const byGroup = new Map<string, ChatMember[]>();
  const noGroup: ChatMember[] = [];
  for (const m of members) {
    if (m.isFounder) founders.push(m);
    else if (m.groupName) byGroup.set(m.groupName, [...(byGroup.get(m.groupName) ?? []), m]);
    else noGroup.push(m);
  }
  return [
    { key: "founders", title: "Founders", members: founders },
    ...[...byGroup.entries()]
      .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      .map(([name, list]) => ({ key: `group:${name}`, title: name, members: list })),
    { key: "none", title: "No group", members: noGroup },
  ].filter((s) => s.members.length > 0);
}

/**
 * "New message": pick a member to message (the viewer's group and the founders), listed by
 * category (Founders, then each group), with a search by name or display name.
 */
export function PsChatMemberPicker({
  members,
  viewerIsFounder,
  onPick,
  onClose,
}: {
  members: ChatMember[];
  /** Founders can message everyone; others only their group and the founders. */
  viewerIsFounder: boolean;
  onPick: (memberId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? members.filter((m) => m.fullName.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)) : members;
  const sections = toSections(shown);

  return (
    <PsDialog title="New message" description={viewerIsFounder ? "As a founder, you can chat with everyone." : "You can chat with your group and the founders."} onClose={onClose} initialFocus="#chat-member-search">
      <div className="space-y-3">
        <PsInput
          id="chat-member-search"
          type="search"
          aria-label="Search members"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {sections.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">{members.length === 0 ? "There's no one in your group to message yet." : "No one matches that search."}</p>
        ) : (
          <div className="-mx-2 max-h-80 space-y-3 overflow-y-auto">
            {sections.map((section) => (
              <section key={section.key} aria-labelledby={`chat-section-${section.key}`} data-chat-section={section.title}>
                {/* Stays in view while its members scroll under it. */}
                <h3
                  id={`chat-section-${section.key}`}
                  className="sticky top-0 z-10 flex items-center gap-2 bg-gray-900 px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400"
                >
                  {section.title}
                  <span className="font-normal normal-case tracking-normal text-gray-600">{section.members.length}</span>
                </h3>
                <ul aria-label={section.title}>
                  {section.members.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => onPick(m.id)}
                        data-member-id={m.id}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/5"
                      >
                        <PsAvatar name={m.fullName} src={m.avatarUrl} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm text-gray-100">{m.fullName}</span>
                            {m.isFounder && (
                              <PsBadge variant="warning" className="shrink-0 px-2 text-[10px]">
                                Founder
                              </PsBadge>
                            )}
                          </span>
                          <span className="block truncate text-xs text-gray-500">
                            @{m.displayName}
                            {!m.isFounder && <> · {m.role}</>}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </PsDialog>
  );
}
