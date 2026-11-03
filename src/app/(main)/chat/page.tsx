import type { Metadata } from "next";
import { requireCompleteProfile } from "@/features/account/auth/dal";
import { PsChat } from "@/features/communication/chat/components/ps-chat";
import { listChatMembers } from "@/features/communication/chat/queries";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage() {
  const user = await requireCompleteProfile();
  const members = await listChatMembers(user);
  return <PsChat members={members} viewerIsFounder={user.isSuperAdmin} />;
}
