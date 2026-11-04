import type { ReactNode } from "react";
import { CHAT_PATH } from "@/features/communication/chat/constants";
import { INVOICES_PATH } from "@/features/finance/invoices/constants";
import { CALENDAR_PATH } from "@/features/scheduling/calendar/constants";
import { PsBrand } from "./ps-brand";
import { PsSidebarLink } from "./ps-sidebar-link";

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0" aria-hidden>
    {d}
  </svg>
);

export type NavItem = { label: string; href: string; icon: ReactNode };

/** Left-panel navigation. Add an item here once its page exists. */
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: icon(<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />) },
  { label: "Schedule", href: CALENDAR_PATH, icon: icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17h.01M12 17h.01" /></>) },
  { label: "Chat", href: CHAT_PATH, icon: icon(<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 4v-4h0.5A2.5 2.5 0 0 1 5 12.5z" />) },
  { label: "Invoices", href: INVOICES_PATH, icon: icon(<><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4M12 10v7M14 11.25c-.4-.5-1.1-.75-2-.75-1.1 0-2 .6-2 1.5s.9 1.25 2 1.5 2 .6 2 1.5-.9 1.5-2 1.5c-.9 0-1.6-.25-2-.75" /></>) },
];

/**
 * Left-panel navigation. `adminItem` is shown at the bottom, for links that depend on the user's
 * role (e.g. PsAdminNavItem); it renders nothing for users who may not see it. `badges` puts a
 * badge on an item, by its href (e.g. the unread count on Chat). `slots` renders an item itself,
 * by its href, for items that depend on the user (e.g. Invoices, disabled for founders); it gets
 * the item's label, href and icon.
 */
export function PsSidebarNav({
  adminItem,
  badges = {},
  slots = {},
}: {
  adminItem?: ReactNode;
  badges?: Record<string, ReactNode>;
  slots?: Record<string, (item: NavItem) => ReactNode>;
}) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-5">
        <PsBrand />
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              {slots[item.href]?.(item) ?? <PsSidebarLink href={item.href} label={item.label} icon={item.icon} badge={badges[item.href]} />}
            </li>
          ))}
        </ul>
        {adminItem && <div className="mt-auto border-t border-white/10 pt-4 empty:hidden">{adminItem}</div>}
      </nav>
    </>
  );
}
