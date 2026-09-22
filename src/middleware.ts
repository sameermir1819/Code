import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = process.env.JWT_SECRET || "coaching-erp-default-secret-key-min-32-chars-2026";
const key = new TextEncoder().encode(SECRET_KEY);
const COOKIE_NAME = "erp_session_token";

// Staff-only backend route prefixes (Students must NEVER access these)
const STAFF_BACKEND_PREFIXES = [
  "/dashboard",
  "/students",
  "/batches",
  "/teachers",
  "/attendance",
  "/exams",
  "/results",
  "/materials",
  "/finance",
  "/announcements",
  "/notifications",
  "/audit",
  "/settings",
  "/leads",
  "/data-export",
  "/admissions",
  "/courses",
];

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  const isStudent = session?.role === "STUDENT";

  // 1. If user is logged in and visits /login, redirect to their respective workspace
  if (pathname === "/login") {
    if (session) {
      const destination = isStudent ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 2. Protect Student Portal routes (/portal)
  if (pathname.startsWith("/portal")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Authenticated users (students, or staff previewing) can access /portal
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 3. Protect staff-only backend routes
  const isStaffRoute = STAFF_BACKEND_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isStaffRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      if (pathname !== "/dashboard") {
        loginUrl.searchParams.set("redirect", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // CRITICAL: Students are strictly blocked from the backend administration panel
    if (isStudent) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  // 4. For root path `/`, redirect to student portal, admin dashboard, or login
  if (pathname === "/") {
    if (session) {
      const destination = isStudent ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/uploads (public served uploaded images/documents)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png (public assets)
     */
    "/((?!api/uploads|_next/static|_next/image|favicon.ico|logo.png|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
