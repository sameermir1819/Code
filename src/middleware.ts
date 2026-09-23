import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const DEV_JWT_SECRET = "coaching-erp-dev-secret-key-min-32-chars-2026";

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }
  return DEV_JWT_SECRET;
}

const key = new TextEncoder().encode(getJwtSecret());
const COOKIE_NAME = "erp_session_token";

// Staff-only backend route prefixes (Students must NEVER access these)
const STAFF_BACKEND_PREFIXES = [
  "/dashboard",
  "/students",
  "/batches",
  "/faculty",
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
  "/test-series",
  "/users",
  "/timetable",
  "/profile",
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

  // 1. Dedicated Student Login (/student-login & /portal/login)
  if (pathname === "/portal/login") {
    return NextResponse.redirect(new URL("/student-login", request.url));
  }

  if (pathname === "/student-login") {
    if (session) {
      const destination = isStudent ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 2. Staff Login (/login)
  if (pathname === "/login") {
    if (session) {
      const destination = isStudent ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 3. Protect Student Portal routes (/portal)
  if (pathname.startsWith("/portal")) {
    if (!session) {
      const studentLoginUrl = new URL("/student-login", request.url);
      studentLoginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(studentLoginUrl);
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

  // 4. Public Landing Pages: `/`, `/home`, `/apply`
  if (pathname === "/" || pathname === "/home" || pathname === "/apply") {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
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
