import { PsButton } from "@/components/ui/ps-button";
import { signOut } from "../actions";

export function PsSignOutButton() {
  return (
    <form action={signOut}>
      <PsButton type="submit" variant="secondary" size="sm">
        Sign out
      </PsButton>
    </form>
  );
}
