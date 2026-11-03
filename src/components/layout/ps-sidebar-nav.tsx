import type { ReactNode } from "react";
import { CALENDAR_PATH } from "@/features/calendar/constants";
import { cn } from "@/lib/utils/cn";
import { PsBrand } from "./ps-brand";
import { PsSidebarLink } from "./ps-sidebar-link";

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0" aria-hidden>
    {d}
  </svg>
);

type NavItem = { label: string; icon: ReactNode } & ({ href: string } | { soon: true });

/** Left-panel navigation. Add an `href` to an item when its page exists; until then it shows "Soon". */
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: icon(<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />) },
  { label: "Tasks", soon: true, icon: icon(<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>) },
  { label: "Calendar", href: CALENDAR_PATH, icon: icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17h.01M12 17h.01" /></>) },
  { label: "Plans", soon: true, icon: icon(<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></>) },
  { label: "Discussions", soon: true, icon: icon(<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 4v-4h0.5A2.5 2.5 0 0 1 5 12.5z" />) },
  { label: "Performance", soon: true, icon: icon(<path d="M5 19V11M10 19V6M15 19v-5M20 19V9" />) },
];

/**
 * Left-panel navigation. `adminItem` is shown at the bottom, for links that depend on the user's
 * role (e.g. PsAdminNavItem); it renders nothing for users who may not see it.
 */
export function PsSidebarNav({ adminItem }: { adminItem?: ReactNode }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-5">
        <PsBrand />
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              {"soon" in item ? (
                <span aria-disabled="true" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm", "cursor-not-allowed text-gray-600")}>
                  {item.icon}
                  {item.label}
                  <span className="ml-auto rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Soon</span>
                </span>
              ) : (
                <PsSidebarLink href={item.href} label={item.label} icon={item.icon} />
              )}
            </li>
          ))}
        </ul>
        {adminItem && <div className="mt-auto border-t border-white/10 pt-4 empty:hidden">{adminItem}</div>}
      </nav>
    </>
  );
}
