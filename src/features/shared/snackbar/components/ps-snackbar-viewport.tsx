"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { FLASH_COOKIE, parseFlashCookie } from "../flash-cookie";
import { getServerSnapshot, getSnapshot, snackbar, subscribe } from "../store";
import { PsSnackbar } from "./ps-snackbar";

/** Shows snackbars queued by the server with flashSnackbar(), then deletes the cookie. */
function consumeFlashCookie() {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${FLASH_COOKIE}=`))
    ?.slice(FLASH_COOKIE.length + 1);
  if (!raw) return;

  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;
  let decoded: string | undefined;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return;
  }
  for (const options of parseFlashCookie(decoded)) snackbar.show(options);
}

/** Fixed top-right stack of snackbars. Mount once, in the root layout. */
export function PsSnackbarViewport() {
  const snackbars = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const pathname = usePathname();

  // Check for server-queued snackbars on first load and after every navigation (e.g. a redirect from a server action).
  useEffect(consumeFlashCookie, [pathname]);

  // A server action that stays on the same page (redirect to the same URL, or refresh()) doesn't
  // change the pathname, so also react to the cookie being set: CookieStore change events where
  // supported (Chromium), otherwise a cheap 1-second check of document.cookie.
  useEffect(() => {
    const cookieStore = (window as Window & { cookieStore?: EventTarget }).cookieStore;
    if (cookieStore) {
      cookieStore.addEventListener("change", consumeFlashCookie);
      return () => cookieStore.removeEventListener("change", consumeFlashCookie);
    }
    const timer = setInterval(consumeFlashCookie, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    // top-20 (80px) keeps snackbars just below the 64px topbar, so they never cover the profile badge or its menu.
    <section
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {snackbars.map((s) => (
        <PsSnackbar key={s.id} snackbar={s} onDismiss={snackbar.dismiss} />
      ))}
    </section>
  );
}
