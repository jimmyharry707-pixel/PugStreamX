// Side-by-side layout for overlapping events in one day column, like Google Calendar:
// events that overlap (directly or through each other) share the width in columns.

/** Events shorter than this still get room for one line of text. */
const MIN_MINUTES = 20;

export function layoutEvents<T extends { start: number; end: number }>(events: T[]): (T & { column: number; columns: number })[] {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);
  const placed: (T & { column: number; columns: number })[] = [];
  let group: (T & { column: number; columns: number })[] = [];
  let columnEnds: number[] = [];
  let groupEnd = -1;

  const closeGroup = () => {
    for (const event of group) event.columns = columnEnds.length;
    placed.push(...group);
    group = [];
    columnEnds = [];
  };

  for (const event of sorted) {
    const end = Math.max(event.end, event.start + MIN_MINUTES);
    if (event.start >= groupEnd) closeGroup();
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= event.start);
    if (column === -1) column = columnEnds.push(end) - 1;
    else columnEnds[column] = end;
    group.push({ ...event, column, columns: 1 });
    groupEnd = Math.max(groupEnd, end);
  }
  closeGroup();
  return placed;
}
