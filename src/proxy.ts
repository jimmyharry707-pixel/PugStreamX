import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_ROUTES, SESSION_COOKIE, SIGN_IN_PATH } from "@/features/auth/constants";

// Optimistic check only: sends visitors without a session cookie to the sign-in page.
// The real session check happens in src/features/auth/dal.ts (requireUser / getCurrentUser).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ROUTES.includes(pathname) || request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(SIGN_IN_PATH, request.url));
}

export const config = {
  // Skip API routes, Next.js internals and static files (anything with a file extension).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
