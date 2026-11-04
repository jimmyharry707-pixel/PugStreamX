"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/** A small "Copy" button that copies `text`, then says "Copied" (or how to copy it by hand). */
export function PsCopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("yes");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied(null), 2000);
  }
  return (
    <button type="button" onClick={copy} className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-xs text-brand-300 hover:bg-white/5", className)}>
      {copied === "yes" ? "Copied" : copied === "failed" ? "Select and copy it" : label}
    </button>
  );
}
