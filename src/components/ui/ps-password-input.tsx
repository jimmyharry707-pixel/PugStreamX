"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { PsIconButton } from "./ps-icon-button";
import { PsInput } from "./ps-input";

/** Password input with an eye button that shows or hides the text. */
export function PsPasswordInput({ className, id, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <PsInput id={id} type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <PsIconButton
        label={visible ? "Hide password" : "Show password"}
        aria-controls={id}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-1 my-auto size-8"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-[18px]" aria-hidden>
          {visible ? (
            <>
              <path d="m3 3 18 18" />
              <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.4-1.4" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
          ) : (
            <>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </PsIconButton>
    </div>
  );
}
