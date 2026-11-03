import { PsAvatar } from "@/components/ui/ps-avatar";
import {
  PsTable,
  PsTableBody,
  PsTableCell,
  PsTableHead,
  PsTableHeaderCell,
  PsTableRow,
  PsTableRowLink,
} from "@/components/ui/ps-table";
import { roleLabel } from "@/features/users/roles";
import type { UserListItem } from "@/features/users/types";
import { PsUserActiveButton } from "./ps-user-active-button";
import { PsUserStatusBadge } from "./ps-user-status-badge";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

/**
 * Every account, with its role, status and an Activate / Deactivate button.
 * Clicking a row opens that user's full profile (`profileHref`).
 * On phones each row is a card: the member on top, status + role + button below.
 */
export function PsUserTable({
  users,
  currentUserId,
  profileHref,
  groupNames,
}: {
  users: UserListItem[];
  currentUserId: string;
  profileHref: (userId: string) => string;
  /** Group id → name. */
  groupNames: Record<string, string>;
}) {
  return (
    <PsTable label="Users" stack>
      <PsTableHead>
        <PsTableRow>
          <PsTableHeaderCell>Member</PsTableHeaderCell>
          <PsTableHeaderCell hideBelow="md">Role</PsTableHeaderCell>
          <PsTableHeaderCell>Status</PsTableHeaderCell>
          <PsTableHeaderCell hideBelow="lg">Joined</PsTableHeaderCell>
          <PsTableHeaderCell align="end">
            <span className="sr-only">Actions</span>
          </PsTableHeaderCell>
        </PsTableRow>
      </PsTableHead>
      <PsTableBody>
        {users.map((user) => {
          const name = user.profile?.displayName ?? user.email;
          const isSelf = user.id === currentUserId;
          return (
            <PsTableRow key={user.id} data-user-id={user.id} interactive>
              <PsTableCell grow stack="full">
                <div className="flex min-w-0 items-center gap-3">
                  <PsAvatar name={name} src={user.profile?.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-100">
                      <PsTableRowLink href={profileHref(user.id)} scroll={false}>
                        {user.profile ? user.profile.fullName : <span className="text-gray-400">Profile not completed</span>}
                      </PsTableRowLink>
                      {isSelf && <span className="ml-2 text-xs font-normal text-gray-500">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {user.profile && <>@{user.profile.displayName} · </>}
                      {user.email}
                    </p>
                  </div>
                </div>
              </PsTableCell>
              <PsTableCell hideBelow="md" className="text-gray-300">
                {roleLabel(user.role)}
                {user.groupId && groupNames[user.groupId] && <p className="text-xs text-gray-500">{groupNames[user.groupId]}</p>}
              </PsTableCell>
              {/* Phones: indented under the name (16px padding + 40px avatar + 12px gap), with the role. */}
              <PsTableCell stack="fill" className="max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-x-2 max-sm:gap-y-1 max-sm:pl-[4.25rem]">
                <PsUserStatusBadge active={user.active} />
                {/* The Role column is hidden below md; show it here instead. */}
                <span className="whitespace-nowrap text-xs text-gray-400 md:hidden">
                  {roleLabel(user.role)}
                  {user.groupId && groupNames[user.groupId] && <> · {groupNames[user.groupId]}</>}
                </span>
              </PsTableCell>
              <PsTableCell hideBelow="lg" className="whitespace-nowrap text-gray-400">
                <time dateTime={user.createdAt}>{dateFormat.format(new Date(user.createdAt))}</time>
              </PsTableCell>
              <PsTableCell stack="auto" align="end" aboveRowLink>
                {/* You can't lock yourself out, and active founders can't be deactivated. */}
                {isSelf || (user.isSuperAdmin && user.active) ? (
                  <span className="hidden text-xs text-gray-500 sm:inline">—</span>
                ) : (
                  <div className="flex justify-end">
                    <PsUserActiveButton userId={user.id} active={user.active} name={name} />
                  </div>
                )}
              </PsTableCell>
            </PsTableRow>
          );
        })}
      </PsTableBody>
    </PsTable>
  );
}
