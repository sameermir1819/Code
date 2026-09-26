// Read-only production smoke check. Does not sign in or change application data.
const assert = require("node:assert/strict");

async function main() {
  const origin = new URL(process.argv[2] || "http://localhost:3100");
  assert.ok(["http:", "https:"].includes(origin.protocol), "Use an HTTP(S) application URL");
  assert.ok(!origin.username && !origin.password, "Do not include credentials in the URL");
  for (const path of ["/api/health", "/login", "/test-series", "/results"]) {
    const response = await fetch(new URL(path, origin), { redirect: "manual", signal: AbortSignal.timeout(45000) });
    if (path === "/api/health") {
      const health = await response.json();
      assert.equal(response.status, 200, "Health endpoint must return HTTP 200");
      assert.equal(health.services?.database?.status, "healthy", "Database must be reachable");
      assert.match(response.headers.get("cache-control") || "", /no-store/, "Health responses must not be cached");
    } else if (path === "/login") {
      assert.equal(response.status, 200, "Login must render successfully");
    } else {
      assert.ok([302, 303, 307, 308].includes(response.status), `${path} must redirect anonymous visitors`);
      const destination = new URL(response.headers.get("location"), origin);
      assert.equal(destination.pathname, "/login", `${path} must require staff login`);
    }
    console.log(`PASS ${path}: HTTP ${response.status}`);
  }
}

main().catch((error) => {
  console.error(`Smoke check failed: ${error.message}`);
  process.exitCode = 1;
});
