// Shapes of the documents stored in MongoDB (minus `_id`, which the data layer strips).

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

export type NewStream = Pick<Stream, "title" | "streamer" | "category" | "tags">;
