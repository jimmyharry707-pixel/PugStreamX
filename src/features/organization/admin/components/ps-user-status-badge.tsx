import { PsBadge } from "@/components/ui/ps-badge";

/** "Active" or "Inactive" (can't sign in until a super-admin activates the account). */
export function PsUserStatusBadge({ active }: { active: boolean }) {
  return <PsBadge variant={active ? "success" : "warning"}>{active ? "Active" : "Inactive"}</PsBadge>;
}
