import { Fragment, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import "@/static/css/components/ps-animated-background.css";

// Pure CSS, so it costs no JavaScript. Animations and keyframes live in
// src/static/css/components/ps-animated-background.css and pause for users who prefer reduced motion.
//
// The wall shows what the app is for: planning (timelines), discussion (chat), performance
// (charts, goals) and task assignment (task cards).
//
// Seamless-loop geometry (keep these in sync if you change the layout):
// - The wall is 160vmax wide with COLUMNS columns, so a column is about (160 / COLUMNS)vmax wide.
// - Every widget has a fixed aspect ratio of at least 4:3 (height ≥ 0.75 × width), so heights
//   scale with the screen.
// - One copy of a column = WIDGETS_PER_COLUMN widgets ≈ 7 × 0.75 × 26.7vmax ≈ 1.4vmax, which is
//   taller than any screen measured along the tilted column (at most ≈ 1.19vmax). So the screen is
//   always covered, and scrolling by exactly one copy lands on an identical frame.

const vars = (v: Record<string, string | number>) => v as CSSProperties;

const AVATAR_COLORS = ["bg-brand-400", "bg-accent-500", "bg-info-500", "bg-success-500", "bg-danger-500"];

function Avatars({ seed, count = 3 }: { seed: number; count?: number }) {
  return (
    <div className="flex -space-x-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={cn("size-4 rounded-full ring-2 ring-gray-900", AVATAR_COLORS[(seed + i) % AVATAR_COLORS.length])} />
      ))}
    </div>
  );
}

/** Widget shell: fixed 4:3 shape (see geometry note above), header row, flexible body. */
function Card({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex aspect-[4/3] flex-col overflow-hidden rounded-xl border border-white/10 bg-gray-900/90 p-3 shadow-lg shadow-black/30">
      <div className="mb-2.5 flex shrink-0 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 truncate text-[11px] font-semibold text-gray-200">{title}</span>
        {aside}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

// Task assignment
const TASKS = ["Design review", "Update roadmap", "Fix login bug", "Write weekly report", "Client meeting prep", "Plan sprint 15", "Onboard new member", "Budget check"];
const STATUSES = [
  { label: "To do", className: "bg-gray-700 text-gray-200" },
  { label: "In progress", className: "bg-info-500/20 text-info-300" },
  { label: "Review", className: "bg-accent-500/20 text-accent-300" },
  { label: "Done", className: "bg-success-500/20 text-success-300" },
];

function TaskWidget({ seed }: { seed: number }) {
  const status = STATUSES[seed % STATUSES.length];
  const done = status.label === "Done";
  return (
    <Card
      title={
        <>
          <span className={cn("ps-animated-bg__check grid size-3.5 shrink-0 place-items-center rounded border", done ? "border-success-400 bg-success-500" : "border-gray-500")}>
            {done && (
              <svg viewBox="0 0 12 12" className="size-2.5 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="m2.5 6.5 2.5 2.5 4.5-5" pathLength={1} />
              </svg>
            )}
          </span>
          <span className={cn("truncate font-medium", done && "text-gray-400 line-through")}>{TASKS[seed % TASKS.length]}</span>
        </>
      }
    >
      <div className="h-1.5 w-4/5 rounded-full bg-white/10" />
      <div className="mt-1 h-1.5 w-1/2 rounded-full bg-white/10" />
      <div className="mt-auto flex items-center justify-between">
        <Avatars seed={seed} count={1 + (seed % 3)} />
        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", status.className)}>{status.label}</span>
      </div>
    </Card>
  );
}

// Discussion
const CHANNELS = ["# planning", "# design-team", "# weekly-sync", "# marketing"];

function ChatWidget({ seed }: { seed: number }) {
  const rows = [
    { mine: false, width: "w-3/4" },
    { mine: true, width: "w-2/3" },
  ];
  return (
    <Card title={CHANNELS[seed % CHANNELS.length]} aside={<span className="size-1.5 rounded-full bg-success-400" />}>
      <div className="flex flex-1 flex-col justify-end gap-2">
        {rows.map((row, i) => (
          <div key={i} className={cn("flex items-end gap-1.5", row.mine && "flex-row-reverse")}>
            <span className={cn("size-4 shrink-0 rounded-full", AVATAR_COLORS[(seed + i * 2) % AVATAR_COLORS.length])} />
            <span className={cn("h-4 rounded-lg", row.width, row.mine ? "bg-brand-400/30" : "bg-white/10")} />
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className={cn("size-4 shrink-0 rounded-full", AVATAR_COLORS[(seed + 3) % AVATAR_COLORS.length])} />
          <span className="ps-animated-bg__typing flex gap-0.5 rounded-lg bg-white/10 px-2 py-1.5">
            <span className="size-1 rounded-full bg-gray-300" />
            <span className="size-1 rounded-full bg-gray-300" />
            <span className="size-1 rounded-full bg-gray-300" />
          </span>
        </div>
      </div>
    </Card>
  );
}

// Performance
const CHART_TITLES = ["Team performance", "Tasks completed", "Weekly output", "Goal progress"];

function BarChartWidget({ seed }: { seed: number }) {
  const heights = [55, 80, 45, 95, 70, 85, 60].map((h, i) => ((h + seed * 13 + i * 7) % 60) + 40);
  return (
    <Card
      title={CHART_TITLES[seed % CHART_TITLES.length]}
      aside={<span className="rounded-full bg-success-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-success-300">+{8 + (seed % 9)}%</span>}
    >
      <div className="flex flex-1 items-end gap-1.5">
        {heights.map((h, i) => (
          <span
            key={i}
            className={cn("ps-animated-bg__bar flex-1 rounded-t", i === heights.length - 1 ? "bg-brand-400" : "bg-accent-500/70")}
            style={vars({ height: `${h}%`, "--ps-bar-delay": `${-(i * 0.45 + seed * 0.3)}s` })}
          />
        ))}
      </div>
    </Card>
  );
}

function LineChartWidget({ seed }: { seed: number }) {
  const points = [32, 26, 29, 18, 22, 12, 15, 6].map((y, i) => `${i * 14},${Math.max(4, (y + seed * 5) % 34)}`).join(" ");
  return (
    <Card title="Velocity" aside={<span className="text-[9px] font-semibold text-info-300">Sprint {12 + (seed % 6)}</span>}>
      <svg viewBox="0 0 98 40" preserveAspectRatio="none" className="min-h-0 w-full flex-1 overflow-visible" fill="none">
        <polyline points={`0,40 ${points} 98,40`} className="fill-info-500/10" stroke="none" />
        <polyline
          points={points}
          pathLength={1}
          className="ps-animated-bg__line stroke-info-400"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={vars({ "--ps-line-delay": `${-seed * 0.7}s` })}
        />
      </svg>
    </Card>
  );
}

// Planning
function PlanWidget({ seed }: { seed: number }) {
  const rows = [
    { start: 0, span: 45, color: "bg-accent-500/70" },
    { start: 25, span: 40, color: "bg-info-500/70" },
    { start: 40, span: 35, color: "bg-brand-400/80" },
    { start: 60, span: 40, color: "bg-success-500/70" },
  ].map((r, i) => ({ ...r, start: (r.start + seed * 7 + i * 3) % 50 }));
  return (
    <Card title={`Sprint ${14 + (seed % 5)} plan`} aside={<span className="text-[9px] text-gray-400">Mon–Fri</span>}>
      <div className="flex flex-1 flex-col justify-evenly">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-1.5 w-8 shrink-0 rounded-full bg-white/15" />
            <div className="relative h-2.5 flex-1 rounded-full bg-white/5">
              <span className={cn("absolute inset-y-0 rounded-full", row.color)} style={{ left: `${row.start}%`, width: `${row.span}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Goals
const GOAL_COLORS = ["bg-brand-400", "bg-success-400", "bg-accent-400"];

function ProgressWidget({ seed }: { seed: number }) {
  return (
    <Card title={`Q${1 + (seed % 4)} goals`} aside={<Avatars seed={seed + 1} count={2} />}>
      <div className="flex flex-1 flex-col justify-evenly">
        {GOAL_COLORS.map((color, i) => (
          <div key={i}>
            <div className="mb-1 h-1.5 w-1/2 rounded-full bg-white/15" />
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("ps-animated-bg__progress h-full rounded-full", color)}
                style={vars({ "--ps-progress": ((45 + seed * 11 + i * 17) % 50) / 100 + 0.45, "--ps-progress-delay": `${-(i * 1.3 + seed)}s` })}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const WIDGETS = [TaskWidget, BarChartWidget, ChatWidget, TaskWidget, PlanWidget, ProgressWidget, LineChartWidget];

const COLUMNS = 6;
const WIDGETS_PER_COLUMN = 7;

/**
 * Full-screen moving background: a slowly scrolling wall of work widgets (tasks, chat, charts,
 * plans, goals) over drifting color glows. Pass `videoSrc` (a file in /public, e.g.
 * "/videos/auth.mp4") to play a real video instead of the widget wall.
 */
export function PsAnimatedBackground({ videoSrc }: { videoSrc?: string }) {
  return (
    <div aria-hidden className="ps-animated-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Drifting color glows */}
      <div className="ps-animated-bg__glow--a absolute -left-[10%] -top-[20%] size-[60vmax] rounded-full bg-accent-600/25 blur-[100px]" />
      <div className="ps-animated-bg__glow--b absolute -bottom-[25%] -right-[10%] size-[55vmax] rounded-full bg-brand-500/20 blur-[100px]" />
      <div className="ps-animated-bg__glow--c absolute left-[30%] top-[40%] size-[40vmax] rounded-full bg-info-500/15 blur-[100px]" />

      {videoSrc ? (
        <video className="absolute inset-0 size-full object-cover opacity-50" src={videoSrc} autoPlay muted loop playsInline preload="auto" />
      ) : (
        /* Zero-height wall pinned to the screen's center line and tilted around it. Columns hang
           from that line; their scroll animation positions them (see the CSS). */
        <div className="absolute left-1/2 top-1/2 flex h-0 w-[160vmax] -translate-x-1/2 -rotate-12 items-start gap-4 opacity-60">
          {Array.from({ length: COLUMNS }, (_, col) => {
            const widgets = Array.from({ length: WIDGETS_PER_COLUMN }, (_, i) => {
              const seed = col * WIDGETS_PER_COLUMN + i;
              const Widget = WIDGETS[(col * 3 + i) % WIDGETS.length];
              return <Widget key={i} seed={seed} />;
            });
            return (
              <div
                key={col}
                // pb-4 matches gap-4, so each copy is exactly 50% of the column's height.
                className="ps-animated-bg__column flex min-w-0 flex-1 flex-col gap-4 pb-4"
                data-direction={col % 2 ? "down" : "up"}
                style={vars({ "--ps-column-duration": `${70 + (col % 3) * 20}s` })}
              >
                <Fragment key="a">{widgets}</Fragment>
                <Fragment key="b">{widgets}</Fragment>
              </div>
            );
          })}
        </div>
      )}

      <div className="ps-animated-bg__scrim absolute inset-0" />
    </div>
  );
}
