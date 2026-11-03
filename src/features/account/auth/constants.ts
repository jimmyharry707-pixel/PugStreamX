// Kept free of server-only imports so src/proxy.ts can use it.

export const SESSION_COOKIE = "ps_session";

/** How long a sign-in lasts. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Routes that signed-out visitors can open. Everything else requires a session. */
export const PUBLIC_ROUTES = ["/signin", "/signup"];

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const SIGN_IN_PATH = "/signin";
export const HOME_PATH = "/";
