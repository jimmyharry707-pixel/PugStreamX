"use client";

import { useActionState, useEffect, useState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsInput } from "@/components/ui/ps-input";
import { PsTextarea } from "@/components/ui/ps-textarea";
import { snackbar } from "@/features/shared/snackbar/store";
import { requestPayment } from "../actions";
import { ADDRESS_MAX, NOTE_MAX, PAYMENT_METHOD_INFO, PAYMENT_METHODS, type PaymentMethod } from "../constants";

const isMethod = (v: unknown): v is PaymentMethod => PAYMENT_METHODS.includes(v as PaymentMethod);

/**
 * A member asks the founders for a payment: how (crypto BEP20, PayPal, Zelle or Venmo), where
 * to (wallet address, email, phone or username), how much and what for. The address field starts
 * with the one they last used for that method (`lastAddresses`).
 */
export function PsInvoiceForm({ lastAddresses }: { lastAddresses: Partial<Record<PaymentMethod, string>> }) {
  const [state, action, pending] = useActionState(requestPayment, undefined);
  const [method, setMethod] = useState<PaymentMethod>("bep20");
  const info = PAYMENT_METHOD_INFO[method];
  const errors = state?.errors;
  // Refill only what was typed for this method.
  const typedAddress = state?.values?.method === method ? state.values.address : undefined;

  useEffect(() => {
    if (state?.sentAt) snackbar.success("Invoice sent. A founder will review it.");
  }, [state?.sentAt]);

  return (
    <form action={action} noValidate className="space-y-5">
      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-gray-200">Payment method</legend>
        <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m}
              className="relative flex cursor-pointer flex-col rounded-xl border border-white/10 bg-gray-800/60 px-3 py-2.5 transition hover:border-white/20 has-checked:border-brand-400 has-checked:bg-brand-400/10 has-focus-visible:ring-2 has-focus-visible:ring-brand-400"
            >
              <input
                type="radio"
                name="method"
                value={m}
                checked={method === m}
                onChange={(e) => isMethod(e.target.value) && setMethod(e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-100">{PAYMENT_METHOD_INFO[m].label}</span>
              <span className="text-xs text-gray-400">{m === "bep20" ? "USDT / BNB Smart Chain" : m === "paypal" ? "Email" : m === "zelle" ? "Email or phone" : "Username"}</span>
            </label>
          ))}
        </div>
        {errors?.method && <p className="mt-1.5 text-sm text-danger-400">{errors.method[0]}</p>}
      </fieldset>

      <PsField id="address" label={info.addressLabel} errors={errors?.address} hint={info.hint}>
        {(p) => (
          <PsInput
            // A new field per method, so it starts with that method's address.
            key={method}
            name="address"
            required
            maxLength={ADDRESS_MAX}
            autoComplete="off"
            spellCheck={false}
            placeholder={info.placeholder}
            defaultValue={typedAddress ?? lastAddresses[method] ?? ""}
            className={method === "bep20" ? "font-mono" : undefined}
            {...p}
          />
        )}
      </PsField>

      <PsField id="amount" label="Amount (USD)" errors={errors?.amount}>
        {(p) => (
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              $
            </span>
            <PsInput name="amount" required inputMode="decimal" autoComplete="off" placeholder="0.00" defaultValue={state?.values?.amount} className="pl-7 tabular-nums" {...p} />
          </div>
        )}
      </PsField>

      <PsField id="note" label="Note" errors={errors?.note} hint="What this payment is for, e.g. the work and the dates.">
        {(p) => <PsTextarea name="note" required rows={3} maxLength={NOTE_MAX} defaultValue={state?.values?.note} {...p} />}
      </PsField>

      {errors?.form && <PsAlert>{errors.form[0]}</PsAlert>}

      <div className="flex justify-end">
        <PsButton type="submit" disabled={pending} className="min-w-40">
          {pending ? "Sending…" : "Send invoice"}
        </PsButton>
      </div>
    </form>
  );
}
