import "server-only";
import { cookies } from "next/headers";
import { SNACKBAR_MAX } from "./constants";
import { FLASH_COOKIE, parseFlashCookie } from "./flash-cookie";
import type { SnackbarOptions } from "./types";

/**
 * Queues a snackbar to show on the next page the browser lands on. Use it in server actions
 * and route handlers, typically right before redirect():
 *   await flashSnackbar({ type: "success", message: "Saved" });
 *   redirect("/");
 */
export async function flashSnackbar(options: Omit<SnackbarOptions, "duration">) {
  const cookieStore = await cookies();
  const queued = parseFlashCookie(cookieStore.get(FLASH_COOKIE)?.value);
  cookieStore.set(FLASH_COOKIE, JSON.stringify([...queued, options].slice(-SNACKBAR_MAX)), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
}
