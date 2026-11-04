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
import { PAYMENT_METHOD_INFO } from "../constants";
import { formatAmount } from "../format";
import type { Invoice } from "../types";
import { PsInvoiceStatusBadge } from "./ps-invoice-status-badge";
import { PsInvoiceTime } from "./ps-invoice-time";

/**
 * Invoices, newest first. Clicking a row opens its details (`detailsHref`). `showMember` adds
 * who asked (Admin › Invoices). On phones each row is a card.
 */
export function PsInvoiceTable({ invoices, detailsHref, showMember = false }: { invoices: Invoice[]; detailsHref: (id: string) => string; showMember?: boolean }) {
  return (
    <PsTable label="Invoices" stack>
      <PsTableHead>
        <PsTableRow>
          {showMember && <PsTableHeaderCell>Member</PsTableHeaderCell>}
          <PsTableHeaderCell>Amount</PsTableHeaderCell>
          <PsTableHeaderCell hideBelow={showMember ? "md" : undefined}>Payment</PsTableHeaderCell>
          <PsTableHeaderCell>Status</PsTableHeaderCell>
          <PsTableHeaderCell hideBelow="lg">Requested</PsTableHeaderCell>
        </PsTableRow>
      </PsTableHead>
      <PsTableBody>
        {invoices.map((invoice) => {
          const method = PAYMENT_METHOD_INFO[invoice.method];
          const amount = (
            <span className="font-semibold tabular-nums text-gray-100">
              <PsTableRowLink href={detailsHref(invoice.id)} scroll={false}>
                {formatAmount(invoice.amountCents)}
              </PsTableRowLink>
            </span>
          );
          return (
            <PsTableRow key={invoice.id} data-invoice-id={invoice.id} interactive>
              {showMember && (
                <PsTableCell grow stack="full">
                  <div className="flex min-w-0 items-center gap-3">
                    <PsAvatar name={invoice.member?.fullName ?? "?"} src={invoice.member?.avatarUrl ?? undefined} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-100">{invoice.member?.fullName ?? <span className="text-gray-400">Former member</span>}</p>
                      {invoice.member && <p className="truncate text-xs text-gray-400">@{invoice.member.displayName}</p>}
                    </div>
                  </div>
                </PsTableCell>
              )}
              <PsTableCell stack={showMember ? "auto" : "fill"} className="whitespace-nowrap">
                {amount}
                {/* The date column is hidden below lg; show it here instead. */}
                <p className="text-xs text-gray-500 lg:hidden">
                  <PsInvoiceTime at={invoice.createdAt} />
                </p>
              </PsTableCell>
              <PsTableCell hideBelow={showMember ? "md" : undefined} grow={!showMember} stack={showMember ? "hide" : "full"} className="max-sm:order-last">
                <p className="text-gray-200">{method.label}</p>
                <p className="truncate font-mono text-xs text-gray-400">{invoice.address}</p>
              </PsTableCell>
              <PsTableCell stack="auto" className={showMember ? "max-sm:ml-auto" : undefined}>
                <PsInvoiceStatusBadge status={invoice.status} />
              </PsTableCell>
              <PsTableCell hideBelow="lg" className="text-gray-400">
                <PsInvoiceTime at={invoice.createdAt} />
              </PsTableCell>
            </PsTableRow>
          );
        })}
      </PsTableBody>
    </PsTable>
  );
}
