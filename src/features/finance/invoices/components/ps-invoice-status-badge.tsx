import { PsBadge } from "@/components/ui/ps-badge";
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "../constants";

const VARIANT = { pending: "warning", accepted: "success", rejected: "danger" } as const;

export function PsInvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <PsBadge variant={VARIANT[status]} data-status={status} className="whitespace-nowrap">
      {INVOICE_STATUS_LABELS[status]}
    </PsBadge>
  );
}
