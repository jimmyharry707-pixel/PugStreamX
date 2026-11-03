import { cn } from "@/lib/utils/cn";
import { formatFullDate, formatShortMonth, formatWeekday, isSameDay, isSameMonth, monthWeeks } from "../dates";

const ROWS: Record<number, string> = { 4: "grid-rows-4", 5: "grid-rows-5", 6: "grid-rows-6" };

/** Month grid: one cell per day, from the week holding the 1st to the week holding the last day. */
export function PsCalendarMonthView({
  date,
  today,
  onOpenDay,
}: {
  date: Date;
  today: Date | null;
  onOpenDay: (day: Date) => void;
}) {
  const weeks = monthWeeks(date);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="grid grid-cols-7 border-b border-white/10">
        {weeks[0].map((day) => (
          <div key={day.getDay()} className="py-2 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {formatWeekday(day)}
          </div>
        ))}
      </div>
      <div className={cn("grid min-h-[28rem] flex-1 grid-cols-7", ROWS[weeks.length])}>
        {weeks.flat().map((day) => {
          const isToday = isSameDay(day, today);
          const inMonth = isSameMonth(day, date);
          return (
            <div key={day.getTime()} className="min-w-0 border-b border-r border-white/5 p-1 [&:nth-child(7n)]:border-r-0">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={formatFullDate(day)}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-medium transition",
                    isToday
                      ? "bg-amber-400 text-zinc-950 hover:bg-amber-300"
                      : inMonth
                        ? "text-zinc-200 hover:bg-white/10"
                        : "text-zinc-600 hover:bg-white/5 hover:text-zinc-400",
                  )}
                >
                  {/* Like Google Calendar, the 1st of a month also shows the month name. */}
                  {day.getDate() === 1 ? `${formatShortMonth(day)} 1` : day.getDate()}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
