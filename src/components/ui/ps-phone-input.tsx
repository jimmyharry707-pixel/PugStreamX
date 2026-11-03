"use client";

import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import "@/static/css/components/ps-phone-input.css";
import { PsInput } from "./ps-input";
import type { PsFieldControlProps } from "./ps-field";

/**
 * Phone number with a country picker (react-phone-number-input). Controlled: `value` is in E.164
 * format (e.g. "+821012345678") or "". A hidden input named `name` submits the value with the form.
 * Flags are bundled, so no images are loaded from other sites.
 */
export function PsPhoneInput({
  name,
  value,
  onChange,
  ...control
}: PsFieldControlProps & { name: string; value: string; onChange: (value: string) => void }) {
  return (
    <>
      <PhoneInput
        {...control}
        className="ps-phone-input"
        flags={flags}
        international
        countryCallingCodeEditable={false}
        value={value || undefined}
        onChange={(v) => onChange(v ?? "")}
        inputComponent={PsInput}
        autoComplete="tel"
        placeholder="Phone number"
        countrySelectProps={{ "aria-label": "Country" }}
      />
      <input type="hidden" name={name} value={value} />
    </>
  );
}
