"use client";

import { useEffect, useRef, useState } from "react";

type Message = { id: number; user: string; text: string; color: string };

const BOT_USERS = ["wheezy_fan", "snortlord", "bark_bark", "curlytail", "fawnfriend", "biscuit99"];
const BOT_LINES = ["LETS GOOO", "that snore was elite 😂", "hi from Brazil 🇧🇷", "pug tax please 🐶", "W stream", "🐾🐾🐾", "first time here, love it", "gg"];
const COLORS = ["text-amber-400", "text-sky-400", "text-pink-400", "text-emerald-400", "text-violet-400", "text-orange-400"];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export default function Chat({ streamer }: { streamer: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, user: streamer, text: "Welcome to the stream! Be nice, pet pugs. 🐶", color: "text-red-400" },
  ]);
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  // Simulated chatter so the room feels alive.
  useEffect(() => {
    const timer = setInterval(() => {
      setMessages((prev) =>
        [...prev, { id: nextId.current++, user: pick(BOT_USERS), text: pick(BOT_LINES), color: pick(COLORS) }].slice(-100),
      );
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: nextId.current++, user: "you", text, color: "text-amber-300" }]);
    setDraft("");
  }

  return (
    <aside className="flex h-[480px] flex-col rounded-xl border border-white/10 bg-zinc-900 lg:h-auto lg:max-h-[calc(100vh-7rem)]">
      <h2 className="border-b border-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Stream chat
      </h2>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm">
        {messages.map((m) => (
          <p key={m.id} className="break-words">
            <span className={`font-semibold ${m.color}`}>{m.user}</span>
            <span className="text-zinc-500">: </span>
            {m.text}
          </p>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Send a message"
          maxLength={200}
          className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button className="rounded-lg bg-amber-400 px-4 text-sm font-semibold text-zinc-950 hover:bg-amber-300">Chat</button>
      </form>
    </aside>
  );
}
