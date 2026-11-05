@AGENTS.md

# PugStreamX project rules

These rules are mandatory for all work in this repo.

Past session summaries (decisions, gotchas, open items) are in `log/chat_history/`. Read the newest one
before starting work, and add a new summary when the user asks to save the chat history.

## 1. Components use the `ps-` prefix

- Every React component file is named `ps-<name>.tsx` in kebab-case, e.g. `ps-button.tsx`, `ps-sign-in-form.tsx`.
- Each exports a named component `Ps<Name>` in PascalCase, e.g. `PsButton`, `PsSignInForm`. No default exports.
- Where components live:
  - `src/components/ui/`: basic reusable building blocks (`PsButton`, `PsIconButton`, `PsInput`, `PsPasswordInput`, `PsTextarea`, `PsPhoneInput`, `PsField`, `PsFormField`, `PsAlert`, `PsBadge`, `PsAvatar`, `PsChip`, `PsSection`, `PsEmptyState`, `PsSelect`, `PsSwitch`, `PsDialog`, `PsModal`, `PsTable`, `PsPagination`, `PsCopyButton`, `PsStat`). They have no data fetching and no feature knowledge.
  - **Every paginated list uses `PsPagination`** (`ps-pagination.tsx`) and the helpers in `src/lib/utils/pagination.ts`, never its own page links:
    - The page is in the URL as `?page=N` (1-based; page 1 leaves it out). Read it with `parsePage(params.page)`. Then `paginate(page, total, pageSize)` gives the clamped `page`, the `pageCount` and the query's `skip`. A page past the end shows the last one.
    - Render `<PsPagination {...page} href="<list URL without page>" label="… pages" />`. Other search params in `href` (filters) are kept.
    - It shows "Showing 11–20 of 45" and ‹ 1 … 4 5 6 … 9 › (at most 7 numbers). It renders nothing for an empty list.
    - Links that open a row (e.g. `?invoice=<id>`) keep the current `page`, so closing the dialog returns to it.
    - A second list on the same URL (e.g. inside a dialog) gets its own page param: `<PsPagination param="activityPage" … />` (`withPage(href, n, param)`), so the list behind it keeps `?page`.
  - `PsCopyButton` copies a value ("Copy", then "Copied"). `PsStat` is a summary tile: a label, a big value and a line under it.
  - **Every table uses `PsTable`** (`ps-table.tsx`) and its parts (`PsTableHead`, `PsTableBody`, `PsTableRow`, `PsTableHeaderCell`, `PsTableCell`, `PsTableRowLink`), never a raw `<table>`.
    - `hideBelow="md"` hides a column on smaller screens; give its header cell the same value.
    - `grow` makes the main column take the leftover width and truncate long text.
    - `stack` turns rows into cards on phones; each cell's `stack` prop (`full` / `fill` / `auto` / `hide`) places it.
    - For clickable rows, use `<PsTableRow interactive>` plus a `PsTableRowLink`, and give cells with their own buttons `aboveRowLink`.
    - Without `stack`, a wide table scrolls inside its card, never the page.
    - Its CSS (`ps-table.css`) is in the `components` layer, so utilities passed as `className` (e.g. `max-sm:pl-4`) still win.
  - Dialogs: `PsDialog` is the shared shell (title, ×/Esc/click-outside close, focus trap; a bottom sheet on phones). `PsModal` is a `PsDialog` driven by the URL: render it when a search param is set (e.g. `?user=<id>`), and closing it navigates to `closeHref`. Dialogs cover snackbars, so show the results of actions inside them inline (`PsAlert`), not as snackbars.
  - **Confirmations use the global confirm popup, never `window.confirm`.** `<PsConfirmRoot />` is mounted once in the root layout (don't mount it again). From client code: `import { confirm } from "@/features/shared/confirm/store"`, then `if (await confirm({ title, message, confirmLabel, tone: "danger" })) { ... }`. Use `tone: "danger"` for deletes and anything that can't be undone; the dialog then starts focused on Cancel.
  - Form controls go inside `PsField` (label + error + hint), which passes `id` and `aria-*` props to the control: `<PsField id="x" label="X" errors={e}>{(p) => <PsTextarea name="x" {...p} />}</PsField>`. `PsFormField` is the shortcut for plain inputs.
  - `src/components/layout/`: app frame pieces:
    - `PsAppShell`: the main-site frame (left panel, topbar, main container; the panel becomes a drawer below the `lg` breakpoint).
    - `PsSidebarNav`: left-panel navigation. Its items live in `NAV_ITEMS`; add an item only once its page exists (no placeholder buttons). Role-dependent links go in its `adminItem` slot (shown at the bottom, inside `<Suspense>`), e.g. `PsAdminNavItem`. Its `badges` prop puts a client component at the right of an item, by href (e.g. `PsChatUnreadBadge` on Chat), so the nav itself stays feature-free.
    - `PsSidebarMenu`: a left-panel button that opens a popup menu of links above it (e.g. Admin > Users). The button is highlighted while one of its pages is open.
    - `PsSidebarNav`'s `slots` prop renders an item itself (by href) when it depends on the user. It gets the item's label, href and icon; wrap it in `<Suspense>` with the plain link as the fallback. Examples: `PsInvoicesNavItem`, which is disabled for founders, and `PsSeekerNavItem`, which is disabled for Callers, Developers and accounts without a role.
    - `PsSidebarLink`: one left-panel link, highlighted while its page is open. With `disabled`, it's greyed out and can't be clicked, and `disabledHint` is its tooltip.
    - `PsBrand`: the logo. `PsContainer`: a max-width wrapper.
    - `PsAnimatedBackground`: the moving work-themed background behind the auth pages, used in `src/app/(auth)/layout.tsx`.
  - Layering (z-index): confirm popup `z-[130]` > dialogs and the mobile drawer `z-[120]` > topbar and its menus `z-[110]` > snackbars `z-[100]` > page content. Anything the user opens must sit above snackbars.
  - `src/features/<category>/<feature>/components/`: components tied to one feature.
- Build pages from existing `ps-` components before writing raw markup. If a pattern repeats, make it a new `ps-` component.
- Next.js special files (`page.tsx`, `layout.tsx`, `not-found.tsx`, `route.ts`, `proxy.ts`, …) keep their required names.

## 2. MongoDB naming

- The database name is **`PugStreamX`**, fixed as `DB_NAME` in `src/lib/db/config.ts`. Do not make it configurable or hard-code it elsewhere.
- Every collection name **must start with `ps_`** (e.g. `ps_users`, `ps_sessions`).
- Register every collection in `COLLECTIONS` in `src/lib/db/config.ts`. Its type rejects names without `ps_`. Add its indexes to `INDEXES` there too; they're created automatically on first connection.
- Access collections only through `getCollection<T>("<key>")` from `src/lib/db/client.ts`. Never use a raw string name.
- Files (images, attachments) go in GridFS buckets registered in `BUCKETS` (also `ps_`-prefixed, e.g. `ps_avatars`, stored as `ps_avatars.files` / `ps_avatars.chunks`). Access them with `getBucket("<key>")`. Validate uploads on the server by their real bytes, never by file name or claimed type.
- **The exception:** job seekers' work results (`.html` pages) are saved on disk in `upload/` at the project root, as the user asked. Build paths only with `uploadPath()` (`src/lib/storage/upload.ts`) from server-generated names, never from the uploaded file name. The folder's contents are git-ignored (only `upload/.gitkeep` is committed), and a deployment must keep `upload/` on persistent storage.

## 3. Scalable structure

```
src/
  app/                  routes only: thin pages and route handlers that compose features
  proxy.ts              optimistic auth redirect (cookie presence only)
  components/ui/        ps-* basic components
  components/layout/    ps-* app shell
  features/<category>/<feature>/
    types.ts            document and input types
    queries.ts          reads, server-only (use "use cache" + cacheTag for shared, non-user data)
    mutations.ts        writes, server-only; callers invalidate any affected cache tag
    validation.ts       zod schemas for untrusted input
    actions.ts          server actions ("use server")
    components/         ps-* feature components
  lib/db/               config.ts (names/indexes) and client.ts (connection)
  lib/utils/            pure helpers (cn, form state helpers)
  lib/storage/          upload.ts: paths inside upload/ (files saved on disk)
```

- Features are grouped by area into categories under `src/features/`:

  | Category | Features |
  |---|---|
  | `account/` | `auth` (sign-in, sessions), `profile` (required profile, avatar), `users` (user documents, roles), `activity` (recent activity) |
  | `scheduling/` | `calendar` (the week grid, dates, time zones), `schedules` (the events on it) |
  | `organization/` | `groups`, `admin` (the super-admin panel) |
  | `communication/` | `chat` (direct messages), `notifications` (founders' announcements, topbar bell) |
| `finance/` | `invoices` (members ask the founders for a payment) |
| `work/` | `seeker` (job seekers upload their work results: bid counts) |
  | `shared/` | app-wide UI services used everywhere: `confirm` (confirm popup), `snackbar` |

- A new feature (follows, chat, tasks, …) gets its own folder in the category it belongs to (e.g. `src/features/scheduling/tasks/`), using the same file layout. Add a new category only for a new area that fits none of these, and list it in the table.
- Pages, actions and route handlers never talk to MongoDB directly. They call a feature's `queries.ts` or `mutations.ts`.
- After a write to cached data, invalidate its tag: `revalidateTag(TAG, "max")` in route handlers, `updateTag(TAG)` in server actions.
- Import with the `@/` alias (`@/features/account/auth/dal`), except for relative imports inside the same feature. Never reach into another feature with `../`.

### Calendar (`src/features/scheduling/calendar/`)

- `/calendar` (`CALENDAR_PATH`) is a Google-Calendar-style **week-only** `PsCalendar`: a 24-hour grid for 7 days using the full width. The week title in its toolbar (`PsCalendarDatePicker`) opens a month calendar popup (`PsMiniCalendar`) for jumping to a week. It has no events yet. There are no Day or Month views.
- The shown week lives in the URL (`?date=YYYY-MM-DD`, any day of that week). With no date it shows this week. Moving around uses `window.history.pushState`, so it makes no server request.
- "Today" is only known in the browser: `useNow()` and `useTimeZoneSetting()` are null on the server, and the calendar shows a skeleton until they're ready.
- **Time zone:** `PsTimeZoneSelect` sits at the right of the calendar toolbar. It's our own dark popup with a search box, not a native `<select>`: Windows draws native dropdown lists white, and their type-to-jump can't search 400+ labels that all start with "GMT".
  - The choice is kept in this browser's localStorage (`ps_time_zone`); `""` means the device's zone.
  - "Today" and the now-line come from `zonedTime(now, zone)` (`time-zone.ts`), never from `Date#getHours()` or `getDate()`.
  - The list comes from `Intl.supportedValuesOf("timeZone")`, which uses old canonical names (e.g. `Asia/Calcutta`). The stored value keeps that name, but `timeZoneName()` shows the current one ("Asia/Kolkata"), and search matches both.
- Date maths goes through the pure helpers in `dates.ts`, which work on local days and `"YYYY-MM-DD"` keys. The week starts on `WEEK_STARTS_ON` (Monday). Weekends (`isWeekend`) are shown in rose: tinted columns in the week, rose dates in the popup.
- Keyboard shortcuts as in Google Calendar: T (this week), J / N (next week), K / P (previous week), C (create a schedule).
- Shared time zone maths lives in `src/lib/utils/time-zone.ts`, safe on the server and in the browser: `zonedTime`, `zonedParts`, `zonedToUtc` (wall time in a zone → exact moment) and `isValidTimeZone`.

### Schedules (`src/features/scheduling/schedules/`)

- These are the events on the calendar (e.g. interviews), stored in `ps_schedules`.
- **Each schedule belongs to a group** (`groupId`; `userId` is its creator). A group can have several Profile Managers, so every schedule shows **the PM who made it**: `Schedule.profileManager` (full name, display name, photo; never their id; null if the account is gone, shown as "Former member"). `withLinks()` fills it in for every read. It's a "Profile Manager" row in the details, and "Company · PM name" on the block (blocks of an hour or more show that third line).
  - **Each PM has their own color:** `profileManager.color` (1 to `PM_COLORS` = 8) picks `--color-pm-<n>` (color.css). The server numbers the group's Profile Managers oldest account first, so the first 8 never share a color and everyone in the group sees the same ones. A creator who's no longer a PM in the group gets a color from their id. Blocks set `data-pm-color` and `.ps-calendar-time-grid__block` mixes their background, border and text from that one color; the details show a dot in it next to the PM's name. The group's members share one calendar. Every query and mutation filters by `groupId`, and no user or group ids are sent to the browser (`toSchedule()`).
- **Who can do what** is decided by `calendarAccess(user, requestedGroupId?)` in `access.ts`. Pages, actions and route handlers must use it.

  | `mode` | Who | Can do |
  |---|---|---|
  | `"manage"` | Profile Manager (role 1) in a group | Create schedules in their group; edit, drag and delete **only their own** (other PMs' are read-only for them) |
  | `"call"` | Caller (role 2) in a group | See every field (read-only); fill in the caller fields with `saveCallerFields` |
  | `"support"` | Developer (role 3) in a group | See only the group's schedules with **Tech supporter needed**, read-only (every field; no forms) |
  | `"view"` | Super-admin | See any group's calendar read-only (`?group=<id>`, group picker in the toolbar) |
  | `"none"` | Anyone else, or a PM/Caller without a group | No calendar; the page shows why |

  - Every action re-checks the mode, so hidden buttons are never the only guard.
  - The grid's `editable` prop turns off drag, click-to-create and resize for anyone who isn't a manager.
  - **Only the PM who made a schedule can change it.** `Schedule.mine` (from `viewerId` in `ScheduleReadOptions`) says whether the viewer made it. Other PMs' blocks have `CalendarEvent.editable: false` (no drag or resize strip), and their details show "Only <name> can change this schedule." instead of Edit and Delete. On the server, `saveSchedule`, `reschedule` and `removeSchedule` check the owner first (`NOT_OWNER`), and `updateSchedule`, `rescheduleSchedule` and `deleteSchedule` also filter by `userId`.
  - **A schedule that has passed (its `end` is reached) can't be changed or deleted, even by its PM.** In the browser, everything switches at the exact end: blocks stop being draggable (`useLatestReached()` over the week's ends in `ps-calendar.tsx`), the details show "This schedule has passed, so it can't be changed or deleted." instead of Edit and Delete (`usePassed()`), and an open Edit form turns Save off (`PsScheduleForm passesAt`); all in `use-started.ts`. On the server, `changeable()` in `actions.ts` is the one check (in the group, the owner's, not passed) for `saveSchedule`, `reschedule` and `removeSchedule`, and the three mutations also filter by `end: { $gt: now }`; when a write matches nothing, `whyFailed()` reads it again for the right message. **A schedule can't be created, edited or dragged to end in the past** (`ENDS_IN_PAST`), since it would be locked at once and a slip couldn't be undone. Past schedules go only when their group is deleted.
  - **Developers** (`techSupportOnly(access)`): `listSchedules`, `findScheduleByUid` and `withLinks` take a `techSupportOnly` flag, so the week, opening a schedule by ID (`/api/schedules/[uid]`, 404 otherwise) and the linked-schedule lists only ever include schedules with `techSupportRequired`. The toolbar shows "Tech support schedules only".
- **Fields:**
  - Required (set by the PM): `title`, `start` / `end`, `clientCompany`, `interviewer`, `meetingUrl`, `resumeUrl`, `jobDescriptionUrl`.
  - Optional (stored as `null` when empty): `note` (the PM's). `linkedUids` is a list (empty when none).
  - **Screen share:** the PM sets only the `screenShareRequired` switch (`PsSwitch`). The Caller adds `screenShareUrl`, and only while it's required. Turning it off clears the link. Older schedules with a link count as required.
  - **Tech supporter needed:** the PM's `techSupportRequired` switch (`PsSwitch`; missing on older schedules = off). The details show "Needed" (blue `info` badge), and the block shows a wrench (`CalendarEvent.techSupport`). It decides what Developers see.
  - **`callerNote`** ("Note (Caller)") is written by Callers. The PM, the founder and Callers all see it.
  - **Done (`doneAt`):** the Caller form (`PsCallerForm`) follows the schedule's **`start`**, not its end, because an interview can finish early. Its `data-phase` is `before`, `after` or `done`.
    - **Before the interview starts:** only the screen share link (when required) and Save. Without a required link there's nothing to fill in; a line says so.
    - **Once it has started:** only "Note (Caller)" and **Done** (`intent=done`). Done needs the note, saves it and sets `doneAt`.
    - **Once done:** only **Undo done** (`intent=reopen`), which clears `doneAt` and keeps the note.
    - `saveCallerFields` enforces the same with the server clock: links only before the start, the note and Done from the start on.
    - The form switches at the exact start time (`useStarted()` in `use-started.ts`), not on a minute tick. Success messages only show in the state they came from (`CallerFormState.intent`).
    - Once the interview has started, a required link that was never added shows "Not added" in grey, not the red "Required".
    - A repeated Done keeps the first `doneAt`. A PM moving a schedule so it starts in the future (Edit or drag) clears `doneAt`.
    - `Schedule.doneAt` is an ISO string or null. Everyone sees it: a green "Done" pill on the calendar block (`CalendarEvent.done`) and a Status row in the details. PM edits leave it as is.
  - Older schedules may lack `meetingUrl`. `Schedule.meetingUrl` is then `null` and shows "—"; Edit requires it.
- **Schedule ID (`uid`):** every schedule has a unique **10-digit** ID (e.g. `"4829103756"`, a string; `SCHEDULE_UID_PATTERN`), the ID members see.
  - It's shown in the details with a Copy button, and it's what "Linked schedules" takes.
  - It's a random number set on create (`newScheduleUid()`). On a rare repeat, the unique index rejects it and a new one is drawn (`isDuplicateUid`).
  - Older schedules (no ID, or an earlier long UUID) get a 10-digit ID when first read (`withUids` in `queries.ts`). Links to the old ID are moved to the new one. `upgradeOlderSchedules` also does a full pass once per group per server process. It moves schedules made before groups existed into their creator's group.
  - It has a unique index. Keep the database `_id` (`Schedule.id`) for actions and internal use; members never see it.
- **Linked schedules:** `linkedUids` is a **list** of other schedules' `uid`s in the same group, in the order entered, at most `LINKS_MAX`.
  - **Older data:** some schedules have a single `linkedUid`. It's read as a one-item list (`linkedUidsOf()`) and removed on the next save.
  - **Form:** `PsLinkedSchedulesField` shows one ID input per row, all named `linkedUids`. Each row has a remove (×) button, and **Add one** adds a row.
    - The action reads the rows with `formData.getAll("linkedUids")`, because `Object.fromEntries` keeps only one.
    - Empty rows and repeats are dropped. Spaces and dashes are ignored ("482 910 3756").
  - **Checks:** `saveSchedule` checks every row at once, for format and for whether it's another schedule in the group (not itself). Other groups' IDs get the same "doesn't exist" error.
    - It returns `linkedErrors` (one per row, shown under that row) and `linkedValues` (to refill the rows).
  - **Reads** fill in `Schedule.linked` (title and times, in order) with `withLinks()`.
  - **Deleting** a schedule removes it from every list (`$pull`).
  - **In the details,** "Linked schedules" lists them all. Clicking one loads it by ID from `GET /api/schedules/[uid]` (same group only, 404 otherwise; it may be in another week). It opens in the same dialog, with "Back to …" (a stack in `DialogState.back`).
  - Links must be `http(s)` (`scheduleSchema`), and `safeUrl()` checks them again before rendering. Links open in a new tab with `rel="noopener noreferrer"`.
- **Time:** `start` / `end` are exact moments (UTC `Date`s).
  - The form has a **Time zone** field (`PsTimeZoneSelect variant="field"`), which starts on the calendar's zone. It sends `date`, `from`, `to` and `timeZone`; `scheduleSchema` turns them into moments with `zonedToUtc`.
  - The zone is stored with the schedule (`ScheduleDoc.timeZone`; missing on older ones, so fall back to the calendar's).
  - Edit reopens the schedule in its own zone. The details show its own zone first, plus the calendar's zone when they differ.
  - Changing the zone in the form keeps the typed wall times.
  - The calendar shows them in the chosen zone, so changing zone moves the blocks. A block crossing midnight is drawn on both days.
- **Reads:** the calendar changes weeks in the browser, so it loads schedules from `GET /api/schedules?from&to[&group]` (`useSchedules`), not from the page.
  - That route returns 401 when signed out and 403 without a calendar, and allows at most `SCHEDULE_RANGE_MAX_DAYS`.
  - Only super-admins' `group` is honoured.
- **Writes** (managers only): `saveSchedule` creates, or updates when the form has a `scheduleId`. `removeSchedule` deletes (after the confirm popup) and `reschedule` saves drags. Callers use `saveCallerFields` (`PsCallerForm` in the details). The calendar then calls `reload()`.
- **UI:** Create (managers only) is a toolbar button on `sm`+ and a floating button on phones. Clicking a block opens `PsScheduleDetails`, which shows every field to everyone; managers also get Edit and Delete, and Callers get the caller form.

### Groups (`src/features/organization/groups/`)

- Groups live in `ps_groups` (`name`, unique ignoring case via `nameKey`). Each user has one group (`UserDoc.groupId`, or null; `PublicUser.groupId`), and a group's members share its calendar.
- Super-admins manage groups at `/admin/groups` (`PsGroupManager`): New group and Rename open a `PsDialog` popup (`PsGroupForm`), and Delete asks first. Only groups without members can be deleted; their schedules (past ones too) are deleted with them (`deleteSchedulesOf`), and the confirm popup says how many.
- A user's group is set in their profile popup at `/admin/users` (`PsUserGroupForm`, `setUserGroup`). The user list shows each member's group under their role.
  - **Drag to create** (Google style, in `PsCalendarTimeGrid`): dragging up or down in a day with a mouse or pen draws a preview snapped to 15 minutes (`DRAG_STEP`). Releasing opens the form with that day and range. Dragging near the top or bottom edge scrolls the hours.
  - A plain click or tap opens the form for 1 hour at the half hour clicked. Touch drags still scroll the grid.
  - A press that starts on a block never creates one, even if released on empty space.
  - **Drag to change time:** dragging a block moves it to another time or day; dragging its bottom strip (`ps-calendar-time-grid__resize`) changes when it ends (at least 15 minutes). Both snap to 15 minutes, and Esc cancels.
    - The grid reports an `EventChange` (days and minutes). `PsCalendar` turns it into exact times in the calendar's zone (moves keep wall-clock time, so daylight saving can't shift them) and shows the change at once (`patch()`).
    - It then saves with the `reschedule` action (`rescheduleSchema`: owner only, end after start, at most 24 h). If saving fails, `reload()` puts the block back.
    - The schedule keeps its own `timeZone`. Touch doesn't drag blocks; it scrolls.
- Blocks use their Profile Manager's `pm-<n>` color (the `event` color when there's none). Overlapping blocks share the column width (`layoutEvents` in `features/scheduling/calendar/event-layout.ts`).
- To add a schedule field: add it to `SCHEDULE_FIELDS`, `scheduleSchema`, `ScheduleDoc` / `ScheduleInput` / `toSchedule`, `PsScheduleForm`, `PsScheduleDetails`, and `editDefaults` in `ps-calendar.tsx`.

### Chat (`src/features/communication/chat/`)

- **Direct messages only** (1-to-1, plain text), at `/chat` (`CHAT_PATH`). The open conversation is in the URL (`?with=<memberId>`, `window.history.pushState`); on phones the list and the conversation show one at a time.
- **Who:** members chat only with **their own group and the founders** (`messageableBy()` in `queries.ts`, used by `listChatMembers` and `findChatMember`). Both must be active with a complete profile.
  - Founders (role 0) can message everyone, in any group or none. A member without a group can message only founders.
  - It's symmetric: whoever can message you, you can message back.
  - The New message picker lists only those people, divided by category: **Founders** first (each with a "Founder" label), then each group by name, then "No group" (only founders see other groups and No group). Other rows show the member's role. `ChatMember` carries `role`, `isFounder` and `groupName` for this. The conversation header shows the same ("@name · Caller · Group A"). `sendChatMessage` and `GET /api/chat/messages` check it again, and another group's member gets a 404.
  - If someone is deactivated or moves to another group later, the history stays readable but they can't be messaged (`canSend: false`; the composer says why).
- **Data:** `ps_conversations` holds one conversation per pair. Its `key` is `"<smaller id>:<larger id>"` (`pairKey`, unique index); it's created by an upsert with the first message. It keeps `lastMessage` / `lastMessageAt` for the list, and `readAt[<memberId>]` for unread counts. `ps_messages` holds the messages (`MESSAGE_MAX` characters, 
 stored as 
).
  - Every read is filtered by the viewer's id, so members only see their own conversations.
  - Deleting an account (Admin) also deletes its conversations and their messages (`deleteConversationsOf`).
- **Allowed messages:** unless a founder is in the conversation (writing to a founder, or a founder writing), a message must be one of the allowed messages in **`src/static/data/chat-messages.json`**, word for word.
  - That file is a list of `{ "category": "Schedule", "context": "Please check the schedule." }`. Edit it to change what members can say; it's read by `templates.ts` (`CHAT_TEMPLATES`, `isTemplateMessage`, `searchTemplates`, `allowsFreeText`).
  - `sendChatMessage` refuses anything else. `GET /api/chat/messages` returns `freeText`, so the page knows which box to show.
  - `PsChatComposer`: with a founder, a free text box (Enter sends, Shift+Enter adds a line). Otherwise a search box (`role=combobox`): typing filters the messages (every word, in the text or the category), shown by category above it. ↑/↓ move, Enter or a click picks one into the box, Enter again sends, Esc closes. Send stays off until the box holds a listed message.
- **Reads:** `GET /api/chat/conversations` (list + unread counts) and `GET /api/chat/messages?with=&before=` (pages of `MESSAGES_PAGE`, oldest first; "Load earlier messages"). **Writes:** the `sendChatMessage` and `markChatRead` actions.
- **Live updates:** `GET /api/chat/stream` is a server-sent event stream of `ChatStreamEvent`s for the signed-in member: `message` (to or from them) and `read` (they read a conversation in another tab).
  - Actions publish to an in-process bus (`bus.ts`, an `EventEmitter` on `globalThis`). **It only reaches streams in the same server process**; running several instances needs a shared channel (MongoDB change streams on a replica set, or Redis).
  - Each stream ends after 5 minutes and the browser reconnects (which re-checks the session). After a reconnect, listeners get `resync` and load again, since events may have been missed. The stream is sent `no-transform` so compression can't hold events back.
  - In the browser, `useChatStream()` shares one `EventSource` per tab between the Chat page and the left-panel badge.
- **Read state:** opening a conversation marks it read, and so do new messages arriving while it's open in a visible tab. The left panel's Chat item shows the total unread (`PsChatUnreadBadge`, "99+" above `UNREAD_MAX`).
- **UI:** `PsChat` (page) = `PsChatList` + `PsChatThread` (with `PsChatComposer`), plus `PsChatMemberPicker` (New message, with search). A message shows at once greyed out ("Sending…") until the server confirms it; if sending fails, the text goes back into the box. Links in messages become clickable (`splitLinks`, http(s) only, new tab, `noopener noreferrer`); message text is never rendered as HTML.

### Notifications (`src/features/communication/notifications/`)

- **Announcements from the founders to every member**, stored in `ps_notifications` (`title`, `message` as plain text, `published`, `publishedAt`).
- **Writing them:** founders use `/admin/notifications` (`ADMIN_NOTIFICATIONS_PATH`, in the Admin menu). It's built from `PsNotificationManager` and `PsNotificationForm`, and paginated with `PsPagination`.
  - New and Edit open a `PsDialog` with Title, Message and a Published switch (on by default). Delete asks first.
  - Drafts (Published off) never reach members.
  - `publishedAt` is set the first time a notification is published, and later edits keep it. It's the time members see, and it decides what counts as new.
- **Topbar bell:** `PsNotificationBell` is a server component inside `<Suspense>` in the main layout. It only shows for members with a complete profile, and it renders the client `PsNotificationCenter`.
  - It lists the published notifications, newest first (at most `NOTIFICATIONS_SHOWN`). Message links become clickable (`splitLinks`); the text is never rendered as HTML.
  - It shows a red dot when one was published after the member last opened the list (`READ_AT_KEY` in localStorage). New ones get a "New" badge.
- **The popup on arrival:** the same popup opens by itself when a member arrives on the site:
  - Once per tab session (`SHOWN_KEY` in sessionStorage), and only if anything is published.
  - **"Don't show for a day"** is a checkbox at the bottom of the popup. If it's ticked when the popup closes, the popup stops opening by itself for 24 hours (`SKIP_UNTIL_KEY` in localStorage, `SKIP_MS`). The bell still opens it.
  - These settings are per browser, not per account.
  - The popup is rendered with `createPortal` into `<body>`. The topbar's `backdrop-blur` traps `position: fixed` children, so any popup opened from inside the topbar needs a portal.
- **Cache:** the published list is the same for everyone, so it's cached (`"use cache"`, `cacheTag(NOTIFICATIONS_TAG)`, `cacheLife("hours")`).
  - `saveNotification` and `removeNotification` call `updateTag(NOTIFICATIONS_TAG)`, so members see changes at once.
  - Database edits made outside these actions show up only when the cache expires (within hours) or the server restarts.

### Invoices (`src/features/finance/invoices/`)

- **Members ask the founders for a payment** at `/invoices` (`INVOICES_PATH`, in the left panel). Invoices are stored in `ps_invoices` (`InvoiceDoc`).
- **The request** (`PsInvoiceForm`, `requestPayment`, `invoiceSchema`) has these fields:
  - **Method** (`PAYMENT_METHODS`, labels in `PAYMENT_METHOD_INFO`): `bep20` (crypto), `paypal`, `zelle` or `venmo`, shown as radio tiles.
  - **Address:** its label and checks depend on the method (`checkAddress` in `validation.ts`):
    - BEP20: a wallet, `0x` and 40 hex digits.
    - PayPal: an email.
    - Zelle: an email or a phone number.
    - Venmo: a username, stored with `@`.

    The field starts with the address the member last used for that method (`lastAddresses`).
  - **Amount** in US dollars ("1,234.50" is fine). It's stored as whole cents (`amountCents`) and must be more than 0 and at most `AMOUNT_MAX`. Show it with `formatAmount()`.
  - **Note**: required.
  - Founders don't send invoices. `/invoices` points them to the admin page, and `requestPayment` refuses them.
- **Status** (`INVOICE_STATUSES`): `pending`, then `accepted` or `rejected`. `PsInvoiceStatusBadge` shows them as warning, success and danger.
- **Review** happens at `/admin/invoices` (`ADMIN_INVOICES_PATH`), which is in the Admin menu and for super-admins only:
  - The page has filter chips with counts (Pending, Accepted, Rejected, All) and Pending and Accepted totals (`PsStat`). Pending is the default and is left out of the URL.
  - Clicking a row opens a `PsModal` (`?invoice=<id>`) with:
    - the details, with a Copy button on the address;
    - `PsInvoiceReviewForm`: a note for the member (`reviewNote`; optional to accept, required to reject), then Accept or Reject after the confirm popup.

    Once a review is saved, the dialog closes and a snackbar confirms it.
  - **A decision is final.** `reviewInvoice` only updates invoices with `status: "pending"`, so two founders can't overwrite each other ("This invoice has already been reviewed.").
  - It stores `reviewedBy` and `reviewedAt`. The details show "Accepted by" or "Rejected by" (the founder), when, and the "Founder's note".
- **History:** `/invoices` lists the member's own invoices, newest first, 10 per page (`INVOICE_PAGE_SIZE`, `PsPagination`), with Pending and Accepted totals (no Rejected card). A row opens the same details, including the founder's answer.
- **Privacy:**
  - `findInvoice(id, ownerId)` only opens the member's own invoices.
  - `Invoice` never carries user ids. The member and the reviewer are sent as a name and photo (`InvoicePerson`; null means "Former member").
- Invoices are kept when an account is deleted, as payment records.
- Times are shown in the calendar's chosen zone, else the device's (`PsInvoiceTime`). The server renders them in UTC.

### Seeker (`src/features/work/seeker/`)

- **Job seekers (role 4) record their bids** at `/seeker` (`SEEKER_PATH`, "Seeker" in the left panel). A **work result** is a set of `.html` files (saved job pages) uploaded together. **Each file is one bid**, so its bid count is its number of files.
- **Who gets what** comes from `seekerAccess(role)` (`access.ts`):

  | `mode` | Who | Gets |
|---|---|---|
  | `"upload"` | Job seeker (role 4) | Their totals, the upload form and the list of their bid counts |
  | `"group"` | Profile Manager (role 1) | The bids of the job seekers **now in their group** (`groupId`; a PM without a group is told so): each seeker's bids, uploads and last upload, the group totals, and all their work results with who uploaded each. No upload form. Founders and Profile Managers can pick one job seeker |
  | `"all"` | Founder (0) | The same view for **every** job seeker, with a Group picker (All groups, each group, No group: `?group=<id>` / `?group=none`) and their group shown |
  | `"none"` | Caller (2), Developer (3), no role | The left-panel tab is disabled (`PsSeekerNavItem`); the page by URL says it's for job seekers |

- **Uploading:** `PsWorkResultForm` (pick or drop files; it shows "N bids" and each file with a remove button) sends them to `POST /api/work-results` as multipart (`files`).
  - It's a route handler, not a server action, because server actions take at most 1 MB. The browser then calls `router.refresh()` and shows a snackbar.
  - The server checks every file again by its bytes (`checkHtmlFile` in `validation.ts`): a `.html` name, not empty, at most `WORK_FILE_MAX_BYTES`, no NUL bytes, starts with a tag, and has `<html` or `<!doctype html` in its first 64 KB.
  - Limits: at most `WORK_FILES_MAX` files and `WORK_UPLOAD_MAX_BYTES` per upload.
  - The same page (by SHA-256) can't be uploaded twice, neither in one upload nor again later.
  - **All or nothing:** if any file is refused, nothing is saved and every problem is listed under the form.
- **Storage:** the files go to `upload/work-results/<userId>/<resultId>/<uuid>.html`. The original names are only stored for display. `ps_work_results` (`WorkResultDoc`) holds `userId`, `bidCount`, `files` (name, storedName, size, sha256) and `createdAt`. If storing the document fails, the files are removed again.
- **The list** ("Bid counts") shows each work result's time and bid count, newest first, 10 per page (`WORK_RESULT_PAGE_SIZE`, `PsPagination`). It has Total bids and Work results totals (`PsStat`). A row opens a `PsModal` (`?result=<id>`) listing its files (`PsWorkResultFiles`). `findWorkResult(id, viewer)` and `readWorkFile` only allow the job seeker's own (`{ userId }`) or, for a Profile Manager, those of a job seeker now in their group (`{ groupId }`), or anyone's for a founder (`{ all: true }`). Anyone else gets a 404.
- **Picking:** `PsSeekerFilters` (`PsSelect`s that navigate) and clicking a row in the Job seekers table (`PsSeekerSummaryTable`) set `?seeker=<display name>` (not an id), which narrows the totals and the bid list (`listSeekerWorkResults(scope, seeker, page)`). Changing the group clears it. An unknown group or job seeker falls back to all. The picks stay in the URL through paging and the work result dialog (`seekerHref({ group, seeker, page, result })`). Only founders' `group` is honoured.
- **Bid counts (Daily / Weekly / Monthly):** founders, Profile Managers and job seekers see `PsBidCounts` above the work results list: bids per day (14 shown), week (12, starting Monday) or month (12), newest first, with bars and the range total. ‹ Earlier / Later › move a screen at a time.
  - The view they pick is remembered in this browser (`ps_bid_period` in localStorage).
  - Periods are days in the calendar's time zone (else the device's), which only the browser knows, so it loads from `GET /api/work-results/counts?period&zone&offset[&group][&seeker]`. The route re-checks access and counts the same job seekers the page shows.
  - The page and that route both resolve who's covered with `resolveSeekerView(user, { group, seeker })` (`view.ts`). Period maths is in `periods.ts` (`periodRanges`, `periodLabel`), counting in `countBidsByPeriod` (`queries.ts`).
  - The list of uploads is headed "Work results".
- **Viewing a file:** each file in the dialog links to `GET /api/work-results/<id>/files/<n>` (`workFileUrl`), which opens in a new tab and shows the page itself, not a download (`Content-Disposition: inline`).
  - The pages are untrusted HTML, so the response has `Content-Security-Policy: sandbox; default-src 'none'; …`: no scripts, forms or popups, an opaque origin (no access to the site's cookies), and only styles, images, fonts and media over https/data load. Keep that header on any route that serves uploaded HTML.
- `WorkResult` carries no user ids or disk paths. `WorkResult.seeker` (name, display name, photo) is only filled in on the group view.
- Deleting an account (Admin) also deletes its work results and their folder (`deleteWorkResultsOf`).

### Activity (`src/features/account/activity/`)

- **Every action records what the member did** in `ps_activities` (`ActivityDoc`: `userId`, `kind`, `text`, `createdAt`). Call `recordActivity(userId, kind, text)` (`mutations.ts`) in every new server action or route handler that changes something, once the change is made and before any `redirect()`. It never fails the action; errors are only logged.
  - `kind` is one of `ACTIVITY_KINDS` (`account`, `schedule`, `chat`, `invoice`, `work`, `admin`), shown as a badge (`ACTIVITY_KIND_LABELS`; `work` reads "Seeker").
  - `text` is written at that moment from the member's point of view ("Created the schedule “Interview” (ID 4829103756)"), so it still reads right after what it names is gone. Quote names and titles with `quoted()`; people are `@display name` (or the email before the profile is done). Chat records only who a message went to, never its text.
  - Recorded today: sign up, sign in, sign out, complete or update the profile; create, edit, move and delete a schedule; the Caller's link, Done and Undo done; send a chat message; request or review a payment; upload a work result; and the founders' admin actions (activate or deactivate, role, group, delete an account; create, rename or delete a group; publish, edit or delete a notification). Reading things (opening pages, marking chats read) isn't recorded.
- **Dashboard** (`/`): the member's own activity, newest first, 10 per page (`ACTIVITY_PAGE_SIZE`, `PsActivityList` with `PsPagination`).
- **Admin › Users:** super-admins see anyone's with **Show activity** (`?activity=<id>&activityPage=N`). Only `requireSuperAdmin()` pages may list someone else's (`listActivitiesPage(userId, page)`).
- Times are shown in the calendar's chosen zone, else the device's (`PsActivityTime`). Deleting an account deletes its activity (`deleteActivitiesOf`).

## 4. Authentication

- Custom email + password auth. Users live in `ps_users`; sessions live in `ps_sessions`, stored as SHA-256 hashes of the random token in the `ps_session` cookie.
- `src/proxy.ts` only checks that the cookie exists. The real check is `getCurrentUser()` / `requireUser()` in `src/features/account/auth/dal.ts`. Every protected page, action and route handler must call one of these.
- Pages that read the session must do it inside `<Suspense>` (Cache Components).
- Never send `UserDoc` to the client. Use `toPublicUser()`.
- To add a sign-up field: add it to `signUpFields` (`features/account/auth/validation.ts`), `ps-sign-up-form.tsx`, `UserDoc` (`features/account/users/types.ts`) and `CreateUserInput`. The `signUp` action stores every validated field except `password`.
- Check-only fields that must not be stored (like `confirmPassword`) are validated in `signUpFields`, then left out of `storedFields`, which strips them before the action sees the data.
- Public routes are listed in `PUBLIC_ROUTES` (`features/account/auth/constants.ts`). Everything else requires sign-in.

### Roles and account activation

- `UserDoc.role` is a number from `ROLES` in `src/features/account/users/roles.ts`, starting at 0. **0 is the founder (super-admin), 1 is Profile Manager (makes and manages their group's schedules), 2 is Caller (sees their group's calendar, fills in the screen share link when required and "Note (Caller)"), 3 is Developer (sees their group's schedules that need a tech supporter, read-only), 4 is Job seeker (uploads work results on the Seeker page; no calendar; their Profile Manager sees their bids).** See the Schedules section for exactly what each can do. New accounts get `role: null` ("No role") until one is given. To add a role, add it to `ROLES` with the next number and give it a label in `ROLE_LABELS`.
- Check permissions with the helpers in `roles.ts` (`isSuperAdmin`, `isProfileManager`, `isCaller`, `isDeveloper`), `PublicUser.isSuperAdmin` or `calendarAccess()`, never by comparing raw numbers in pages.
- New accounts start with `active: false`. Sign-up then creates no session and sends the user to `/signin`, and sign-in is refused (only after the password matched) until a super-admin activates the account. Documents without `active` count as inactive (`isActive()` in `features/account/users/queries.ts`).
- `getCurrentUser()` returns null for inactive accounts, and deactivating an account deletes all its sessions, so access ends immediately.
- If no founder exists, `ensureFounder()` (run on sign-up and sign-in) makes the **oldest** account the founder and activates it. On a new database, the first sign-up becomes the founder.
- Admin pages live under `/admin` (`src/features/organization/admin/`). Only super-admins see the left-panel **Admin** button, which opens a popup menu. Its links are `ADMIN_NAV_ITEMS` (`features/organization/admin/constants.ts`), so add new admin pages there. `/admin` itself redirects to the first one.
- `/admin/users` lists every account with Activate / Deactivate buttons.
  - The list is paginated, 10 per page (`listUsersPage` + `PsPagination`). The query sorts inactive accounts first, then newest first, and the filter chips count every account. The page and the `?status=` filter stay in the URL when a profile is opened and closed.
  - Clicking a row opens the full profile in a `PsModal` (`?user=<id>`), where the role and group can be changed and the account deleted (after the confirm popup). Deleting removes the user, their sessions, avatar file, chats, work results and activity. Founders can't be deleted (change their role first). Super-admins can't change their own role, deactivate or delete themselves, so one always remains.
  - Each row's **Show activity** button opens that member's recent activity in a `PsModal` (`?activity=<id>`, paged with `?activityPage=N` so the list keeps its `?page`). See the Activity section above.
- Admin pages, actions and route handlers must call `requireSuperAdmin()` (`features/account/auth/dal.ts`), which returns a 404 for everyone else. Super-admin accounts can't be deactivated from there.

### Required profile (`src/features/account/profile/`)

- After their first sign-in (and on every sign-in until done) users must complete their profile at `/complete-profile`: avatar, full name, display name (unique, case-insensitive), birthday, address, phone (with country). All required. It's stored as `UserDoc.profile`; `PublicUser.profileComplete` says whether it's done.
- **The main site lives in the `src/app/(main)/` route group.** Its layout renders `PsAppShell`. The left panel and topbar are static; the topbar profile badge (`PsCurrentUserMenu`) and the page content (`PsProfileGate`) wait for the session and redirect incomplete or signed-out users.
- The topbar profile badge shows the photo, display name and role label (`roleLabel()`, e.g. "Profile Manager"; "No role" until one is given). Phones show only the photo; the menu's header always shows the role. The badge opens a menu with **Update profile** (`/profile`, `PROFILE_PATH`) and **Sign out**. `/profile` reuses `PsProfileForm` with `mode="update"`. The photo is optional there, and a replaced photo is deleted only after the new one is saved.
- Avatars are served by `/api/avatars/[id]`, only to signed-in members with a complete profile. Build URLs with `avatarUrl(id)` (`features/account/profile/constants.ts`); `PublicUser.profile.avatarUrl` already has one. Render them with `PsAvatar src={...}`, which uses a plain `<img>` because Next's image optimizer can't fetch auth-protected URLs.
- **Every main-site page, server action and route handler must also call `requireCompleteProfile()`** (`features/account/auth/dal.ts`) itself. Layouts don't re-run on client-side navigation, so the layout gate alone isn't a security boundary.
- Pages outside `(main)` that signed-in users with incomplete profiles may use (like `/complete-profile`) go in `src/app/(auth)/`.
- To add a profile field: add it to `profileSchema` (`validation.ts`), `PROFILE_FIELDS` (`constants.ts`), `UserProfile` (`features/account/users/types.ts`), and an input in `ps-profile-form.tsx`.
- Phone numbers are validated server-side with `libphonenumber-js/max` and stored as `{ number: E.164, country: ISO code }`. Birthdays are stored as `"YYYY-MM-DD"` text so time zones can't shift them.

## 5. CSS lives in `src/static/css/`, one file per unit

- Do **not** add styles to `src/app/globals.css`. It only loads Tailwind and the base files.
- `src/static/data/` holds editable JSON data the app imports (e.g. `chat-messages.json`, the allowed chat messages).
- `src/static/css/base/`: shared foundations, imported from `globals.css`.
  - `color.css`: **every color in the project** (see "Colors" below).
  - `theme.css`: other design tokens (fonts) in `@theme`.
  - `base.css`: element defaults.
  - Add a new base file here only for truly global concerns.
- `src/static/css/components/<component-file-name>.css`: styles for one component, named after it (e.g. `ps-snackbar.css` for `ps-snackbar.tsx`).
  - The component imports its own file: `import "@/static/css/components/ps-snackbar.css";`, so the CSS loads only where it's used.
  - Class names are prefixed with the component's name, BEM style: `.ps-snackbar`, `.ps-snackbar__progress`, `.ps-animated-bg__column`.
  - Keyframes are prefixed `ps-`.
  - Pass per-instance values with CSS variables (e.g. `style={{ "--ps-snackbar-duration": "5000ms" }}`) and states with `data-*` attributes, not inline `animation` or `transition` strings.
- Plain Tailwind utilities in JSX are still fine for layout, spacing and colour. Use a unit CSS file for keyframes, complex gradients, pseudo-elements, media-query behaviour (e.g. reduced motion), and anything hard to read as utilities.
- Unit files are not processed with Tailwind's `@theme`. Only the base files (`color.css`, `theme.css`, imported via `globals.css`) can define Tailwind tokens.

### Colors (`src/static/css/base/color.css`)

- All colors are defined there and nowhere else. Tailwind's own palette is switched off (`--color-*: initial`), so `zinc`, `amber`, `red`, etc. **don't exist**. A class like `bg-zinc-800` silently does nothing.
- Use the role names, each a full 50–950 scale (except `pm`):

  | Role | Use for |
  |---|---|
  | `gray` | surfaces, borders, text, icons |
  | `brand` | primary buttons, links, focus, current page, today |
  | `accent` | a second color for decoration and charts |
  | `danger` | errors, deletes, live |
  | `success` | saved, active, done |
  | `warning` | inactive, needs attention |
  | `info` | notices, in progress |
  | `event` | schedule blocks in the calendar |
  | `weekend` | Saturdays and Sundays in the calendar |
  | `pm` | one color per Profile Manager in the calendar: `pm-1` … `pm-8` (single colors, not 50–950 scales) |

  Besides those: `white` and `black` (for overlays, e.g. `bg-white/10`, `bg-black/60`), plus `background` / `foreground` for the page.
- In JSX use utilities: `bg-gray-900`, `text-brand-400`, `border-danger-500/40`.
- In unit CSS use the variables: `var(--color-gray-500)`. For transparency, use `color-mix(in oklab, var(--color-white) 6%, transparent)`.
- Never write hex / `rgb()` / `oklch()` values outside `color.css`. To restyle the site, change the values there.
- A new kind of color gets a new role in `color.css` (`--color-<role>-<shade>`, with a comment saying what it's for), not a one-off value.

## 6. Snackbars (`src/features/shared/snackbar/`)

- Shown at the top right, just below the topbar (80px from the top), for 5 s (paused while hovered or focused), max 5 at once (the oldest is dropped). Types: `default`, `success`, `info`, `warning`, `error`.
- `<PsSnackbarViewport />` is mounted once in the root layout. Don't mount it again.
- **Client code:** `import { snackbar } from "@/features/shared/snackbar/store"`, then `snackbar.success("Saved")`, `snackbar.error(msg, { title, duration })`, `snackbar.dismiss(id)`.
- **Server actions and route handlers:** `await flashSnackbar({ type, message })` from `@/features/shared/snackbar/flash`, usually right before `redirect()`. A short-lived `ps_flash` cookie carries it to the next page.
- Never call `snackbar.*` on the server. Its state is module-level and would leak between users.
- Defaults (duration, max) live in `src/features/shared/snackbar/constants.ts`.

## 7. Finish every task with a commit message suggestion

At the end of every task, suggest a commit message in Conventional Commits format,
e.g. `feat(auth): add display name to sign-up`, in a code block the user can copy.
Do not commit unless the user asks.
