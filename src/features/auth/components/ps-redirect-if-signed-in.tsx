import { redirect } from "next/navigation";
import { getCurrentUser } from "../dal";
import { HOME_PATH } from "../constants";

/**
 * Sends already signed-in users away from the sign-in/sign-up pages. Renders nothing.
 * Wrap in <Suspense> so the rest of the page can still be prerendered.
 */
export async function PsRedirectIfSignedIn() {
  if (await getCurrentUser()) redirect(HOME_PATH);
  return null;
}
