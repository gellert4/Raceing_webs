import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  // Inline styles/scripts are required by the current SSR renderer. No third-party scripts permitted.
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
  if (request.nextUrl.protocol === "https:") response.headers.set("Strict-Transport-Security", "max-age=31536000");
  if (request.nextUrl.pathname.startsWith("/api/")) response.headers.set("Cache-Control", "no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"] };
