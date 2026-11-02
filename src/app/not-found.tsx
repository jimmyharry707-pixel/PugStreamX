import { PsLinkButton } from "@/components/ui/ps-button";
import { PsEmptyState } from "@/components/ui/ps-empty-state";

export default function NotFound() {
  return (
    <PsEmptyState
      emoji="🐶❓"
      title="This stream wandered off"
      action={<PsLinkButton href="/" size="lg">Back home</PsLinkButton>}
    >
      We couldn&apos;t find that page. It&apos;s probably chasing its tail somewhere.
    </PsEmptyState>
  );
}
