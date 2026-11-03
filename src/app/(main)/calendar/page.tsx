import type { Metadata } from "next";
import { requireCompleteProfile } from "@/features/auth/dal";
import { PsCalendar } from "@/features/calendar/components/ps-calendar";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  await requireCompleteProfile();

  return <PsCalendar />;
}
