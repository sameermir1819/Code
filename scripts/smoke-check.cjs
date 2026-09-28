// Read-only production smoke check. Does not sign in or change application data.
const assert = require("node:assert/strict");

async function main() {
  const origin = new URL(process.argv[2] || "http://localhost:3100");
  assert.ok(["http:", "https:"].includes(origin.protocol), "Use an HTTP(S) application URL");
  assert.ok(!origin.username && !origin.password, "Do not include credentials in the URL");
  const publicPages = ["/login", "/apply", "/external-results", "/verify/receipt", "/verify/receipt?token=invalid", "/verify/receipt?token=a&token=b"];
  const publicRedirects = { "/student-login": "/" };
  const staffPages = ["/dashboard", "/admissions/new", "/announcements", "/students", "/students/audit-missing", "/batches", "/dashboard/batches", "/courses", "/faculty", "/attendance", "/exams", "/results", "/materials", "/finance/payments", "/finance/outstanding", "/finance/receipts/audit-missing", "/leads", "/test-series", "/test-series/external/audit-missing", "/timetable", "/notifications", "/audit", "/settings", "/data-export", "/users", "/profile"];
  const portalPages = ["/portal", "/portal/profile", "/portal/id-card", "/portal/attendance", "/portal/fees", "/portal/fees/receipts/audit-missing", "/portal/results", "/portal/batches", "/portal/materials", "/portal/test-series"];
  for (const path of ["/api/health", ...publicPages, ...Object.keys(publicRedirects), ...staffPages, ...portalPages]) {
    const response = await fetch(new URL(path, origin), { redirect: "manual", signal: AbortSignal.timeout(45000) });
    if (path === "/api/health") {
      const health = await response.json();
      assert.equal(response.status, 200, "Health endpoint must return HTTP 200");
      assert.equal(health.services?.database?.status, "healthy", "Database must be reachable");
      assert.match(response.headers.get("cache-control") || "", /no-store/, "Health responses must not be cached");
    } else if (publicPages.includes(path)) {
      assert.equal(response.status, 200, `${path} must render successfully`);
      if (path.startsWith('/verify/receipt')) assert.match(await response.text(), /Invalid Receipt QR/);
    } else if (path in publicRedirects) {
      assert.ok([302, 303, 307, 308].includes(response.status), `${path} must redirect`);
      assert.equal(new URL(response.headers.get("location"), origin).pathname, publicRedirects[path]);
    } else {
      assert.ok([302, 303, 307, 308].includes(response.status), `${path} must redirect anonymous visitors`);
      const destination = new URL(response.headers.get("location"), origin);
      assert.equal(destination.pathname, portalPages.includes(path) ? "/student-login" : "/login", `${path} must require login`);
    }
    console.log(`PASS ${path}: HTTP ${response.status}`);
  }
}

main().catch((error) => {
  console.error(`Smoke check failed: ${error.message}`);
  process.exitCode = 1;
});
