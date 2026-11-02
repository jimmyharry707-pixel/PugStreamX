export type Category = {
  slug: string;
  name: string;
  emoji: string;
  gradient: string;
};

export type Stream = {
  id: string;
  title: string;
  streamer: string;
  category: string;
  viewers: number;
  live: boolean;
  tags: string[];
  gradient: string;
};

export const categories: Category[] = [
  { slug: "gaming", name: "Gaming", emoji: "🎮", gradient: "from-violet-600 to-fuchsia-500" },
  { slug: "just-chatting", name: "Just Chatting", emoji: "💬", gradient: "from-sky-500 to-cyan-400" },
  { slug: "music", name: "Music", emoji: "🎵", gradient: "from-pink-500 to-rose-400" },
  { slug: "art", name: "Art", emoji: "🎨", gradient: "from-amber-500 to-orange-400" },
  { slug: "pets", name: "Pets", emoji: "🐶", gradient: "from-emerald-500 to-teal-400" },
  { slug: "coding", name: "Coding", emoji: "💻", gradient: "from-indigo-600 to-blue-500" },
];

export const streams: Stream[] = [
  { id: "pug-nap-cam", title: "24/7 Pug Nap Cam — snoring guaranteed", streamer: "SnortyMcSnooze", category: "pets", viewers: 18420, live: true, tags: ["Chill", "ASMR"], gradient: "from-emerald-600 to-lime-400" },
  { id: "speedrun-sunday", title: "Speedrun Sunday: any% world record attempts", streamer: "FrankThePug", category: "gaming", viewers: 12873, live: true, tags: ["Speedrun", "English"], gradient: "from-violet-700 to-indigo-500" },
  { id: "lofi-beats", title: "lofi beats to nap and wheeze to", streamer: "DJ Wrinkles", category: "music", viewers: 9311, live: true, tags: ["Lofi", "Study"], gradient: "from-rose-600 to-pink-400" },
  { id: "pixel-art-jam", title: "Drawing every pug breed in pixel art", streamer: "PixelPaws", category: "art", viewers: 4120, live: true, tags: ["Pixel Art", "Creative"], gradient: "from-orange-600 to-amber-400" },
  { id: "build-a-stream-app", title: "Building a streaming app in Next.js, live", streamer: "CodeWithBiscuit", category: "coding", viewers: 3507, live: true, tags: ["Next.js", "TypeScript"], gradient: "from-blue-700 to-sky-400" },
  { id: "morning-chat", title: "Morning coffee & chat — come say hi", streamer: "MuffinTheMoody", category: "just-chatting", viewers: 2984, live: true, tags: ["IRL", "Cozy"], gradient: "from-cyan-600 to-sky-400" },
  { id: "battle-royale", title: "Ranked battle royale grind to Diamond", streamer: "ToastyPug", category: "gaming", viewers: 2211, live: true, tags: ["Competitive", "FPS"], gradient: "from-fuchsia-700 to-purple-500" },
  { id: "acoustic-covers", title: "Acoustic covers — taking requests!", streamer: "Noodle Strings", category: "music", viewers: 1650, live: true, tags: ["Acoustic", "Requests"], gradient: "from-pink-700 to-fuchsia-400" },
  { id: "puppy-training", title: "Puppy training 101 with Professor Pug", streamer: "ProfessorPug", category: "pets", viewers: 1288, live: true, tags: ["Educational"], gradient: "from-teal-600 to-emerald-400" },
  { id: "watercolor", title: "Relaxing watercolor landscapes", streamer: "Brushy", category: "art", viewers: 742, live: true, tags: ["Watercolor", "Chill"], gradient: "from-amber-600 to-yellow-400" },
  { id: "cozy-farm", title: "Cozy farm sim — building the pug barn", streamer: "Pumpkin Plays", category: "gaming", viewers: 615, live: true, tags: ["Cozy", "Sim"], gradient: "from-indigo-600 to-violet-400" },
  { id: "rust-from-scratch", title: "Writing a game engine in Rust", streamer: "Ferris&Pug", category: "coding", viewers: 498, live: true, tags: ["Rust", "Gamedev"], gradient: "from-sky-700 to-indigo-400" },
];

export function getStream(id: string) {
  return streams.find((s) => s.id === id);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function formatViewers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n);
}
