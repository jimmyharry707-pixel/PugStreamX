"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PsIconButton } from "@/components/ui/ps-icon-button";
import { PsInput } from "@/components/ui/ps-input";
import { LINKS_MAX } from "../constants";

type Row = { key: number; value: string };

// Row keys only need to be unique within the page.
let lastRowKey = 0;
const toRows = (values: string[]): Row[] => values.map((value) => ({ key: ++lastRowKey, value }));

/**
 * "Linked schedules": one ID input per linked schedule (each named `linkedUids`, so they
 * submit as a list), a remove button per row and "Add one". `values` refills the rows (new
 * values replace the rows, e.g. after a failed save); `rowErrors` shows an error under a row.
 */
export function PsLinkedSchedulesField({
  values,
  rowErrors,
  errors,
}: {
  values: string[];
  rowErrors?: (string | null)[];
  /** Errors about the whole list. */
  errors?: string[];
}) {
  const id = useId();
  const [rows, setRows] = useState(() => toRows(values));
  const [lastValues, setLastValues] = useState(values);
  // New values (a failed save sends back what was typed): start over from them.
  if (values !== lastValues) {
    setLastValues(values);
    setRows(toRows(values));
  }

  // Focus the row just added.
  const listRef = useRef<HTMLUListElement>(null);
  const [focusKey, setFocusKey] = useState<number | null>(null);
  useEffect(() => {
    if (focusKey !== null) listRef.current?.querySelector<HTMLInputElement>(`[data-row="${focusKey}"]`)?.focus();
  }, [focusKey]);

  const add = () => {
    const [row] = toRows([""]);
    setRows((current) => [...current, row]);
    setFocusKey(row.key);
  };

  return (
    <fieldset className="space-y-2" aria-describedby={`${id}-hint`}>
      <legend className="mb-1.5 block text-sm font-medium text-gray-200">Linked schedules (optional)</legend>
      {rows.length > 0 && (
        <ul ref={listRef} className="space-y-2">
          {rows.map((row, index) => {
            const error = rowErrors?.[index];
            return (
              <li key={row.key}>
                <div className="flex items-center gap-2">
                  <PsInput
                    name="linkedUids"
                    data-row={row.key}
                    aria-label={`Linked schedule ${index + 1}`}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error-${row.key}` : undefined}
                    autoComplete="off"
                    spellCheck={false}
                    inputMode="numeric"
                    maxLength={20}
                    placeholder="10-digit ID, e.g. 4829103756"
                    defaultValue={row.value}
                    className="font-mono"
                  />
                  <PsIconButton
                    label={`Remove linked schedule ${index + 1}`}
                    onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                    className="size-9 rounded-lg"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-4" aria-hidden>
                      <path d="m7 7 10 10M17 7 7 17" />
                    </svg>
                  </PsIconButton>
                </div>
                {error && (
                  <p id={`${id}-error-${row.key}`} className="mt-1 text-sm text-danger-400">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {errors?.[0] && <p className="text-sm text-danger-400">{errors[0]}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {rows.length < LINKS_MAX && (
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-sm text-gray-200 transition hover:bg-white/5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" className="size-4" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add one
          </button>
        )}
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          Other schedules&apos; 10-digit IDs. Copy one from that schedule&apos;s details.
        </p>
      </div>
    </fieldset>
  );
}
