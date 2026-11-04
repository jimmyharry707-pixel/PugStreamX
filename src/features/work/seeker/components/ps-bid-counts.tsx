"use client";

import "@/static/css/components/ps-bid-counts.css";
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { PsButton } from "@/components/ui/ps-button";
import { deviceTimeZone, timeZoneName, useTimeZoneSetting } from "@/features/scheduling/calendar/time-zone";
import { cn } from "@/lib/utils/cn";
import { GROUP_FILTER_PARAM, SEEKER_PARAM, WORK_RESULTS_API } from "../constants";
import { BID_PERIOD_LABELS, BID_PERIODS, periodLabel, type BidPeriod } from "../periods";
import type { BidCountsResponse } from "../types";

// The chosen view (Daily, Weekly or Monthly) is remembered in this browser.
const PERIOD_KEY = "ps_bid_period";
let fallback: BidPeriod = "day";
const listeners = new Set<() => void>();
function readPeriod(): BidPeriod {
  try {
    return BID_PERIODS.find((p) => p === localStorage.getItem(PERIOD_KEY)) ?? "day";
  } catch {
    return fallback;
  }
}
function subscribePeriod(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}
function setPeriod(period: BidPeriod) {
  fallback = period;
  try {
    localStorage.setItem(PERIOD_KEY, period);
  } catch {}
  listeners.forEach((l) => l());
}

const plural = (n: number, word: string) => `${n.toLocaleString("en-US")} ${n === 1 ? word : `${word}s`}`;

/**
 * Bid counts per day, week or month (the viewer picks; remembered per browser), newest first,
 * in the calendar's time zone, for the same job seekers the page shows (`group`, `seeker`).
 * Earlier / Later move a screen at a time. `version` changes when bids are added, to reload.
 * Give it a `key` of the filters so moving back resets when they change.
 */
export function PsBidCounts({ group = null, seeker = null, version }: { group?: string | null; seeker?: string | null; version: string }) {
  const period = useSyncExternalStore(subscribePeriod, readPeriod, () => null);
  const setting = useTimeZoneSetting();
  const zone = setting === null ? null : setting || deviceTimeZone();
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<{ key: string; body: BidCountsResponse | null } | null>(null);

  const query = new URLSearchParams({ period: period ?? "", zone: zone ?? "", offset: String(offset) });
  if (group) query.set(GROUP_FILTER_PARAM, group);
  if (seeker) query.set(SEEKER_PARAM, seeker);
  const key = `${query}&v=${version}`;
  const ready = period !== null && zone !== null;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetch(`${WORK_RESULTS_API}/counts?${key}`)
      .then((r) => (r.ok ? (r.json() as Promise<BidCountsResponse>) : null))
      .catch(() => null)
      .then((body) => {
        if (!cancelled) setData({ key, body });
      });
    return () => {
      cancelled = true;
    };
  }, [key, ready]);

  const loading = !ready || data?.key !== key;
  const body = data?.body ?? null;
  const max = Math.max(1, ...(body?.periods.map((p) => p.bids) ?? []));
  const total = body?.periods.reduce((n, p) => n + p.bids, 0) ?? 0;
  const newest = body?.periods[0];
  const oldest = body?.periods[body.periods.length - 1];

  return (
    <div className="ps-bid-counts space-y-4" data-bid-counts data-loading={loading || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Count by" className="inline-flex rounded-full border border-white/10 bg-gray-900 p-1">
          {BID_PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => {
                setPeriod(p);
                setOffset(0);
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition",
                period === p ? "bg-brand-400 font-semibold text-gray-950" : "text-gray-300 hover:text-white",
              )}
            >
              {BID_PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <PsButton type="button" variant="secondary" size="sm" disabled={loading || !body?.hasEarlier} onClick={() => setOffset((o) => o + 1)}>
            ‹ Earlier
          </PsButton>
          <PsButton type="button" variant="secondary" size="sm" disabled={loading || offset === 0} onClick={() => setOffset((o) => Math.max(0, o - 1))}>
            Later ›
          </PsButton>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gray-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-4 py-3">
          <p className="text-sm text-gray-300">
            {period && newest && oldest ? (
              <>
                {periodLabel(period, oldest)} – {periodLabel(period, newest)}
              </>
            ) : (
              " "
            )}
          </p>
          <p className="text-sm text-gray-400" data-window-total>
            <span className="font-semibold tabular-nums text-gray-100">{loading ? "…" : plural(total, "bid")}</span> in this range
          </p>
        </div>
        {loading && !body ? (
          <div className="h-64 animate-pulse" aria-busy="true" />
        ) : !body ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">The counts couldn&apos;t be loaded. Try again.</p>
        ) : (
          <ol className="divide-y divide-white/5" aria-label={`Bids per ${period}`}>
            {body.periods.map((p) => (
              <li key={p.start} data-period={p.start} className="grid grid-cols-[minmax(7.5rem,10rem)_1fr_auto] items-center gap-3 px-4 py-2 text-sm">
                <span className="truncate text-gray-300">{period && periodLabel(period, p)}</span>
                <span className="ps-bid-counts__track" aria-hidden>
                  <span className="ps-bid-counts__bar" style={{ "--ps-bid-share": p.bids / max } as CSSProperties} />
                </span>
                <span className={cn("w-16 text-right tabular-nums", p.bids ? "font-semibold text-gray-100" : "text-gray-600")} data-period-bids>
                  {p.bids}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
      {zone && <p className="text-xs text-gray-500">Days in {timeZoneName(zone)} (the calendar&apos;s time zone). Weeks start on Monday.</p>}
    </div>
  );
}
