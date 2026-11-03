// Shared by the client form and the server. Keep free of server-only imports.

export const COMPLETE_PROFILE_PATH = "/complete-profile";
/** Main-site page for editing an existing profile. */
export const PROFILE_PATH = "/profile";

/** Avatar images are served by src/app/api/avatars/[id]/route.ts to signed-in members only. */
export const avatarUrl = (avatarId: string) => `/api/avatars/${avatarId}`;

/** Avatars are cropped to a square and resized to this many pixels in the browser before upload. */
export const AVATAR_SIZE_PX = 512;
/** Largest original image the browser will accept before resizing. */
export const AVATAR_SOURCE_MAX_BYTES = 15 * 1024 * 1024;
/** Largest avatar the server will store (after browser resizing it's typically under 100 KB). */
export const AVATAR_MAX_BYTES = 512 * 1024;

export const FULL_NAME_MAX = 100;
export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 30;
export const ADDRESS_MAX = 300;

export const PROFILE_FIELDS = ["avatar", "fullName", "displayName", "birthday", "address", "phone"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];
