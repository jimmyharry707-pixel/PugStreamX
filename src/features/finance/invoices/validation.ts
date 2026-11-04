import "server-only";
import { z } from "zod";
import { ADDRESS_MAX, AMOUNT_MAX, NOTE_MAX, PAYMENT_METHODS, type PaymentMethod } from "./constants";

const EMAIL = z.email();
const BEP20 = /^0x[0-9a-fA-F]{40}$/;
const VENMO = /^@?[A-Za-z0-9_-]{5,30}$/;
/** Phone digits for Zelle: 10 to 15 digits, optionally with +, spaces, dashes, dots or brackets. */
const PHONE = /^\+?[\d\s().-]{10,20}$/;

/** Checks and tidies the "where to pay" text for a method. Returns the value to store, or an error. */
function checkAddress(method: PaymentMethod, raw: string): { ok: true; value: string } | { ok: false; message: string } {
  const value = raw.trim();
  switch (method) {
    case "bep20":
      return BEP20.test(value) ? { ok: true, value } : { ok: false, message: "Enter a BEP20 address: 0x followed by 40 letters (a–f) or digits." };
    case "paypal":
      return EMAIL.safeParse(value).success ? { ok: true, value: value.toLowerCase() } : { ok: false, message: "Enter the email of your PayPal account." };
    case "zelle": {
      if (EMAIL.safeParse(value).success) return { ok: true, value: value.toLowerCase() };
      const digits = value.replace(/\D/g, "");
      return PHONE.test(value) && digits.length >= 10 && digits.length <= 15
        ? { ok: true, value }
        : { ok: false, message: "Enter the email or phone number registered with Zelle." };
    }
    case "venmo":
      return VENMO.test(value) ? { ok: true, value: value.startsWith("@") ? value : `@${value}` } : { ok: false, message: "Enter your Venmo username, e.g. @jane-doe." };
  }
}

/** Multi-line text as typed (browsers send line breaks as \r\n). */
const text = (max: number) =>
  z
    .string()
    .transform((v) => v.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().max(max, `At most ${max} characters.`));

/** "1,234.5" or "$1234.50" → 123450 cents. */
const amount = z
  .string()
  .trim()
  .transform((v) => v.replace(/[$,\s]/g, ""))
  .pipe(
    z
      .string()
      .min(1, "Enter the amount.")
      .regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter an amount in US dollars, e.g. 250 or 250.50.")
      .transform((v) => Math.round(Number(v) * 100))
      .refine((cents) => cents > 0, "The amount must be more than $0.")
      .refine((cents) => cents <= AMOUNT_MAX * 100, `The amount can be at most $${AMOUNT_MAX.toLocaleString("en-US")}.`),
  );

/** A member's payment request. */
export const invoiceSchema = z
  .object({
    method: z.enum(PAYMENT_METHODS, "Choose how you want to be paid."),
    address: z.string().trim().min(1, "Enter where to pay you.").max(ADDRESS_MAX, `At most ${ADDRESS_MAX} characters.`),
    amount,
    note: text(NOTE_MAX).pipe(z.string().min(1, "Add a note: what this payment is for.")),
  })
  // The address format depends on the method. Checked even when other fields fail, so every
  // error shows at once.
  .superRefine(
    (data, ctx) => {
      const address = checkAddress(data.method, data.address);
      if (!address.ok) ctx.addIssue({ code: "custom", path: ["address"], message: address.message });
    },
    {
      when: ({ value }) => {
        const v = value as { method?: unknown; address?: unknown } | undefined;
        return PAYMENT_METHODS.includes(v?.method as PaymentMethod) && typeof v?.address === "string" && v.address.trim() !== "";
      },
    },
  )
  .transform((data) => {
    const address = checkAddress(data.method, data.address);
    return { method: data.method, address: address.ok ? address.value : data.address, amountCents: data.amount, note: data.note };
  });

/** A founder accepting or rejecting an invoice. Rejecting needs a note saying why. */
export const reviewSchema = z
  .object({
    invoiceId: z.string().regex(/^[a-f0-9]{24}$/i),
    decision: z.enum(["accept", "reject"]),
    reviewNote: text(NOTE_MAX).transform((v) => v || null),
  })
  .refine((data) => data.decision === "accept" || data.reviewNote, {
    path: ["reviewNote"],
    message: "Add a note saying why it's rejected.",
  });
