const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadReceiptVerification() {
  const source = fs.readFileSync(path.join(__dirname, "../src/lib/receipt-verification.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    Buffer,
    process: { env: { RECEIPT_QR_SECRET: "test-only-receipt-secret" } },
    require(id) {
      if (id === "server-only") return {};
      if (id === "node:crypto") return require(id);
      throw new Error(`Unexpected dependency ${id}`);
    },
  });
  return exports;
}

test("fee receipt QR token verifies the bound receipt and student", () => {
  const verification = loadReceiptVerification();
  const verificationPath = verification.createReceiptVerificationPath("REC-2026-0001", "HAW-26-001");
  const token = new URL(verificationPath, "https://erp.example").searchParams.get("token");

  assert.deepEqual(
    JSON.parse(JSON.stringify(verification.readReceiptVerificationToken(token))),
    { receiptNo: "REC-2026-0001", studentId: "HAW-26-001" },
  );
});

test("fee receipt QR rejects a tampered token", () => {
  const verification = loadReceiptVerification();
  const verificationPath = verification.createReceiptVerificationPath("REC-2026-0001", "HAW-26-001");
  const token = new URL(verificationPath, "https://erp.example").searchParams.get("token");

  assert.equal(verification.readReceiptVerificationToken(`${token}x`), null);
  for (const malformed of [undefined, null, [], [token, token], {}, 42, "x".repeat(2049)]) {
    assert.equal(verification.readReceiptVerificationToken(malformed), null);
  }
});
