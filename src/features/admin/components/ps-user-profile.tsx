import "server-only";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import type { ReactNode } from "react";
import { PsAvatar } from "@/components/ui/ps-avatar";
import { roleLabel } from "@/features/users/roles";
import type { UserDetails } from "@/features/users/types";
import { PsUserAccountActions } from "./ps-user-account-actions";
import { PsUserRoleForm } from "./ps-user-role-form";
import { PsUserStatusBadge } from "./ps-user-status-badge";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" });
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-zinc-200">{children}</dd>
    </div>
  );
}

/** A user's full profile, status and role controls. Server-only: for the Admin pages. */
export function PsUserProfile({ user, isSelf }: { user: UserDetails; isSelf: boolean }) {
  const name = user.profile?.displayName ?? user.email;
  const d = user.details;
  const phone = d ? parsePhoneNumberFromString(d.phone.number) : undefined;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <PsAvatar name={name} src={user.profile?.avatarUrl} size="xl" />
        <div className="min-w-0">
          {/* The detail view shows the whole name (wrapping), unlike the truncated list. */}
          <p className="break-words text-lg font-semibold leading-snug">
            {user.profile?.fullName ?? <span className="text-zinc-400">Profile not completed</span>}
            {isSelf && <span className="ml-2 text-xs font-normal text-zinc-500">(you)</span>}
          </p>
          {user.profile && <p className="break-words text-sm text-zinc-400">@{user.profile.displayName}</p>}
          <p className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
            <PsUserStatusBadge active={user.active} />
            {roleLabel(user.role)}
          </p>
        </div>
      </div>

      <dl className="divide-y divide-white/5 rounded-xl border border-white/10 bg-zinc-950/40 px-4">
        <Row label="Email">{user.email}</Row>
        {d ? (
          <>
            <Row label="Phone">
              {phone?.formatInternational() ?? d.phone.number}
              <span className="text-zinc-500"> · {countryNames.of(d.phone.country) ?? d.phone.country}</span>
            </Row>
            <Row label="Birthday">
              <time dateTime={d.birthday}>{dateFormat.format(new Date(`${d.birthday}T00:00:00Z`))}</time>
            </Row>
            <Row label="Address">
              <span className="whitespace-pre-line">{d.address}</span>
            </Row>
          </>
        ) : (
          <Row label="Profile">
            <span className="text-zinc-400">Not completed yet. Details appear once they sign in and fill it in.</span>
          </Row>
        )}
        <Row label="Joined">
          <time dateTime={user.createdAt}>{dateFormat.format(new Date(user.createdAt))}</time>
        </Row>
      </dl>

      <PsUserRoleForm key={user.id} userId={user.id} role={user.role} isSelf={isSelf} />

      {/* You can't change your own account. Active founders can't be deactivated, and founders
          can't be deleted (change their role first). */}
      {!isSelf && !(user.isSuperAdmin && user.active) && (
        <PsUserAccountActions
          key={user.id}
          userId={user.id}
          name={name}
          active={user.active}
          canChangeActive
          canDelete={!user.isSuperAdmin}
        />
      )}
    </div>
  );
}
