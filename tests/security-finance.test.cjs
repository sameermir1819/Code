const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const ts = require("typescript");
const bcrypt = require("bcryptjs");

// Execute the actual server modules with isolated in-memory database adapters.
// These regressions never connect to, seed, or modify the configured database.
function load(file, mocks) {
  mocks = require("./auth-mock.cjs").withAuthorizationMocks(mocks);
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, console, Date, TextEncoder, URL,
    process: { env: { NODE_ENV: "test", JWT_SECRET: "isolated-regression-test-secret-32-characters" } },
    require(id) {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      throw new Error(`Unexpected dependency: ${id}`);
    },
  }, { filename: file });
  return exports;
}

const student = { id: "student-a", studentId: "STU-A", admissionNo: "ADM-A", parentId: "parent-a", instituteId: "campus-a", status: "ACTIVE" };
const storedHash = bcrypt.hashSync("ChangedPass!", 4);

function loginFixture(overrides = {}) {
  const user = { id: "user-a", name: "Student", email: "student@example.invalid", role: "STUDENT", status: "ACTIVE", isArchived: false, passwordHash: storedHash, student, ...overrides };
  let cookieSet = false;
  let updates = 0;
  const db = {
    user: { findUnique: async () => user, update: async () => { updates++; return user; } },
    student: { findFirst: async () => student },
  };
  const auth = {
    verifyPassword: bcrypt.compare,
    hashPassword: async (password) => bcrypt.hash(password, 4),
    createSessionToken: async () => "test-token",
    setSessionCookie: async () => { cookieSet = true; },
    requireAuth: async () => user,
  };
  const actions = load("src/server/actions/auth.ts", {
    "@/lib/db": { db }, "@/lib/auth": auth, "./audit": { logAudit: async () => {} },
  });
  const portal = load("src/server/actions/portal.ts", {
    "@/lib/db": { db }, "@/lib/auth": auth,
    "next/cache": { revalidatePath: () => {} }, "react": { cache: (fn) => fn },
  });
  return { actions, portal, user, cookieSet: () => cookieSet, updates: () => updates };
}

function studentIdentifierLoginFixture(identifier, studentRecord) {
  const user = {
    id: "student-user",
    name: studentRecord.name,
    email: studentRecord.email,
    role: "STUDENT",
    status: "ACTIVE",
    isArchived: false,
    passwordHash: bcrypt.hashSync(studentRecord.studentId, 4),
    student: studentRecord,
  };
  let cookieSet = false;
  const db = {
    user: {
      findUnique: async () => null,
      findFirst: async () => null,
      create: async () => user,
      update: async () => user,
    },
    student: {
      findFirst: async ({ where }) => {
        assert.equal(JSON.stringify(where).includes('"mode"'), false);
        const matches = where.OR.some((condition) =>
          condition.studentId?.equals === studentRecord.studentId ||
          condition.admissionNo?.equals === studentRecord.admissionNo ||
          condition.phone?.equals === identifier
        );
        return matches ? { ...studentRecord, user, institute: {} } : null;
      },
    },
  };
  const actions = load("src/server/actions/auth.ts", {
    "@/lib/db": { db },
    "@/lib/auth": {
      verifyPassword: bcrypt.compare,
      hashPassword: async (password) => bcrypt.hash(password, 4),
      createSessionToken: async () => "test-token",
      setSessionCookie: async () => { cookieSet = true; },
    },
    "./audit": { logAudit: async () => {} },
  });
  return { actions, cookieSet: () => cookieSet };
}

test("student login accepts a case-insensitive Student ID without SQLite-unsupported Prisma mode", async () => {
  const studentRecord = {
    id: "student-a",
    studentId: "STU-2026-0001",
    admissionNo: "ADM-2026-0001",
    phone: "+91 98112 23344",
    name: "Aarav Sharma",
    email: "student@example.invalid",
    instituteId: "campus-a",
    status: "ACTIVE",
  };
  const f = studentIdentifierLoginFixture("stu-2026-0001", studentRecord);
  const result = await f.actions.loginUser({ identifier: "stu-2026-0001", password: studentRecord.studentId });
  assert.equal(result.success, true);
  assert.equal(f.cookieSet(), true);
});

test("student login accepts the registered phone number", async () => {
  const studentRecord = {
    id: "student-a",
    studentId: "STU-2026-0001",
    admissionNo: "ADM-2026-0001",
    phone: "+91 98112 23344",
    name: "Aarav Sharma",
    email: "student@example.invalid",
    instituteId: "campus-a",
    status: "ACTIVE",
  };
  const f = studentIdentifierLoginFixture(studentRecord.phone, studentRecord);
  const result = await f.actions.loginUser({ identifier: studentRecord.phone, password: studentRecord.studentId });
  assert.equal(result.success, true);
  assert.equal(f.cookieSet(), true);
});

for (const password of ["student123", "Student@123", "password123", "STU-A", "ADM-A"]) {
  test(`changed student password rejects fallback ${password} at login and password change`, async () => {
    const f = loginFixture();
    assert.equal((await f.actions.loginUser({ email: f.user.email, password })).success, false);
    assert.equal(f.cookieSet(), false);
    const changed = await f.portal.updateStudentPassword({ currentPassword: password, newPassword: "AnotherPass!", confirmPassword: "AnotherPass!" });
    assert.equal(changed.success, false);
    assert.equal(f.updates(), 0);
  });
}

test("stored password authenticates and authorizes password changes", async () => {
  const f = loginFixture();
  assert.equal((await f.actions.loginUser({ email: f.user.email, password: "ChangedPass!" })).success, true);
  assert.equal(f.cookieSet(), true);
  assert.equal((await f.portal.updateStudentPassword({ currentPassword: "ChangedPass!", newPassword: "AnotherPass!", confirmPassword: "AnotherPass!" })).success, true);
});

for (const state of [{ status: "SUSPENDED" }, { status: "INACTIVE" }, { isArchived: true }]) {
  test(`login preserves blocked account ${JSON.stringify(state)}`, async () => {
    const f = loginFixture(state);
    assert.equal((await f.actions.loginUser({ email: f.user.email, password: "ChangedPass!" })).success, false);
    assert.equal(f.updates(), 0);
    assert.equal(f.cookieSet(), false);
  });
}

test("existing JWT uses current role and profile links, and rejects disabled/deleted accounts", async () => {
  let user = { id: "user-a", name: "Current", email: "new@example.invalid", role: "TEACHER", status: "ACTIVE", isArchived: false, teacher: { id: "teacher-new" } };
  let token;
  const auth = load("src/lib/auth.ts", {
    "next/headers": { cookies: async () => ({ get: () => ({ value: token }) }) },
    "jose": require("jose"), "bcryptjs": bcrypt,
    "@/lib/db": { db: { user: { findUnique: async () => user } } },
    "@/lib/permissions": { hasRolePermission: () => false },
    "react": { cache: (fn) => fn },
    "next/navigation": { redirect: () => { throw new Error("redirect-login"); } },
  });
  token = await auth.createSessionToken({ id: user.id, role: "SUPER_ADMIN", name: "Old", email: "old@example.invalid" });
  assert.equal((await auth.getSession()).role, "TEACHER");
  assert.equal((await auth.getSession()).teacherId, "teacher-new");
  await assert.rejects(auth.requireAuth(["SUPER_ADMIN"]), /FORBIDDEN/);
  user.status = "SUSPENDED";
  assert.equal(await auth.getSession(), null);
  await assert.rejects(auth.requireAuth(), /redirect-login/);
  user.status = "ACTIVE";
  user.isArchived = true;
  assert.equal(await auth.getSession(), null);
  user = null;
  assert.equal(await auth.getSession(), null);
  token = "invalid";
  assert.equal(await auth.getSession(), null);
});

function financeFixture() {
  let session = { id: "admin", name: "Admin", role: "SUPER_ADMIN" };
  let state = {
    plan: { id: "plan-a", studentId: student.id, finalAmount: 200, paidAmount: 0, balanceAmount: 200 },
    installments: [1, 2].map((n) => ({ id: `inst-${n}`, installmentNumber: n, amount: 100, paidAmount: 0, remainingAmount: 100, dueDate: new Date("2025-01-01") })),
    payments: [], refunds: [],
  };
  const options = [];
  const db = {
    student: { findUnique: async () => student },
    institute: { findUnique: async ({ where }) => ({ id: where.id }) },
    feePlan: {
      findUnique: async () => structuredClone({ ...state.plan, installments: state.installments }),
      findMany: async () => [structuredClone(state.plan)],
      update: async ({ data }) => Object.assign(state.plan, data),
    },
    feeInstallment: { update: async ({ where, data }) => Object.assign(state.installments.find((i) => i.id === where.id), data) },
    payment: {
      count: async () => state.payments.length,
      create: async ({ data }) => {
        const payment = { id: `payment-${state.payments.length + 1}`, ...data };
        state.payments.push(payment);
        return structuredClone(payment);
      },
      findUnique: async ({ where }) => {
        const payment = state.payments.find((p) => where.id ? p.id === where.id : p.receiptNo === where.receiptNo);
        if (!payment) return null;
        return structuredClone({ ...payment, student, refunds: state.refunds.filter((r) => r.paymentId === payment.id), feePlan: { ...state.plan, installments: [...state.installments].reverse() } });
      },
      update: async ({ where, data }) => Object.assign(state.payments.find((p) => p.id === where.id), data),
    },
    refundAdjustment: { create: async ({ data }) => {
      const refund = { id: `refund-${state.refunds.length + 1}`, ...data };
      state.refunds.push(refund);
      return structuredClone(refund);
    } },
    $transaction: async (work, config) => {
      options.push(config);
      const before = structuredClone(state);
      try { return await work(db); } catch (error) { state = before; throw error; }
    },
  };
  const transaction = load("src/lib/finance-transaction.ts", { "@/lib/db": { db } });
  const actions = load("src/server/actions/finance.ts", {
    "@/lib/db": { db }, "@/lib/finance-transaction": transaction,
    "@/lib/campus-scope": load("src/lib/campus-scope.ts", {}),
    "@/lib/collection-totals": load("src/lib/collection-totals.ts", { "./db": { db } }),
    "@/lib/auth": { requireAuth: async (roles) => {
      if (roles && !roles.includes(session.role)) throw new Error("FORBIDDEN");
      return session;
    } },
    "./audit": { logAudit: async () => {} }, "./campus": { getActiveCampusId: async () => "campus-a" },
  });
  return {
    actions, db, options, state: () => state, session: (value) => { session = value; },
    pay: (data = {}) => actions.recordPayment({ studentId: student.id, feePlanId: "plan-a", amount: 100, paymentMethod: "CASH", ...data }),
    refund: (amount) => actions.processRefund({ paymentId: "payment-1", amount, reason: "Test reversal" }),
  };
}

test("login routes reach server validation even with a stale signed JWT", async () => {
  const middleware = load("src/middleware.ts", {
    "jose": { jwtVerify: async () => ({ payload: { id: "suspended-user", role: "STUDENT" } }) },
    "next/server": { NextResponse: {
      next: () => ({ kind: "next", headers: new Map() }),
      redirect: () => ({ kind: "redirect", headers: new Map() }),
    } },
  });
  for (const pathname of ["/login", "/student-login"]) {
    const response = await middleware.middleware({
      nextUrl: { pathname }, url: `http://localhost${pathname}`,
      cookies: { get: () => ({ value: "stale-token" }) },
    });
    assert.equal(response.kind, "next");
  }
});

test("a failed installment write rolls back payment and balance updates", async () => {
  const f = financeFixture();
  const update = f.db.feeInstallment.update;
  f.db.feeInstallment.update = async (args) => {
    if (args.where.id === "inst-2") throw new Error("simulated write failure");
    return update(args);
  };
  await assert.rejects(f.pay({ amount: 150 }), /simulated write failure/);
  assert.equal(f.state().payments.length, 0);
  assert.equal(f.state().plan.paidAmount, 0);
  assert.equal(f.state().installments.reduce((sum, i) => sum + i.paidAmount, 0), 0);
});

test("a retried payment rechecks balances after a competing commit", async () => {
  const f = financeFixture();
  const transaction = f.db.$transaction;
  let competing = true;
  f.db.$transaction = async (work, options) => {
    if (competing) {
      competing = false;
      await f.pay({ amount: 160 });
      throw Object.assign(new Error("concurrent commit"), { code: "P2034" });
    }
    return transaction(work, options);
  };
  await assert.rejects(f.pay({ amount: 120 }), /exceed/i);
  assert.equal(f.state().payments.length, 1);
  assert.equal(f.state().plan.paidAmount, 160);
});

test("rejects selected-installment overpayment and unrelated records without writes", async () => {
  const f = financeFixture();
  await assert.rejects(f.pay({ amount: 150, installmentId: "inst-1" }), /selected installment/);
  await assert.rejects(f.pay({ studentId: "student-b" }), /does not belong/);
  await assert.rejects(f.pay({ installmentId: "foreign-installment" }), /does not belong/);
  await assert.rejects(f.pay({ amount: 201 }), /exceed/i);
  assert.equal(f.state().payments.length, 0);
  assert.equal(f.state().plan.paidAmount, 0);
});

test("auto-distributed payments keep plan and installments balanced", async () => {
  const f = financeFixture();
  await f.pay({ amount: 150 });
  assert.equal(f.state().plan.paidAmount, 150);
  assert.deepEqual(f.state().installments.map((i) => i.paidAmount), [100, 50]);
  await f.pay({ amount: 50, installmentId: "inst-2" });
  assert.equal(f.state().plan.status, "PAID");
  assert.equal(f.state().plan.balanceAmount, 0);
  assert.equal(new Set(f.state().payments.map((p) => p.receiptNo)).size, 2);
  assert.ok(f.options.every((option) => option.isolationLevel === "Serializable"));
});

test("partial refunds are capped cumulatively and final refund closes payment", async () => {
  const f = financeFixture();
  await f.pay({ installmentId: "inst-1" });
  await f.refund(60);
  assert.equal(f.state().payments[0].status, "ADJUSTED");
  assert.equal(f.state().plan.paidAmount, 40);
  assert.equal(f.state().installments[0].paidAmount, 40);
  await assert.rejects(f.refund(60), /remaining refundable/);
  assert.equal(f.state().refunds.length, 1);
  await f.refund(40);
  assert.equal(f.state().payments[0].status, "REFUNDED");
  assert.equal(f.state().plan.paidAmount, 0);
  assert.equal(f.state().plan.balanceAmount, 200);
  assert.equal(f.state().installments[0].remainingAmount, 100);
  await assert.rejects(f.refund(1), /already been refunded/);
});

test("refund of distributed payment reopens installments and permits collection again", async () => {
  const f = financeFixture();
  await f.pay({ amount: 150 });
  await f.refund(75);
  assert.equal(f.state().plan.paidAmount, 75);
  assert.deepEqual(f.state().installments.map((i) => i.paidAmount), [75, 0]);
  await f.pay({ amount: 125 });
  assert.equal(f.state().plan.paidAmount, 200);
  assert.equal(f.state().installments.reduce((sum, i) => sum + i.paidAmount, 0), 200);
});

test("invalid financial amounts fail before any transaction", async () => {
  const f = financeFixture();
  for (const amount of [0, -1, NaN, Infinity, 0.001]) {
    await assert.rejects(f.pay({ amount }), /Amount must/);
    await assert.rejects(f.refund(amount), /Amount must/);
  }
  assert.equal(f.options.length, 0);
});

test("fractional payments and refunds settle exactly to zero", async () => {
  const f = financeFixture();
  await f.pay({ amount: 0.3 });
  await f.refund(0.1);
  await f.refund(0.2);
  assert.equal(f.state().plan.paidAmount, 0);
  assert.equal(f.state().installments[0].paidAmount, 0);
  assert.equal(f.state().payments[0].status, "REFUNDED");
});

test("receipt and ledger access enforce student/parent ownership and staff roles", async () => {
  const f = financeFixture();
  const { payment } = await f.pay();
  for (const session of [
    { role: "STUDENT", studentId: "student-b" },
    { role: "PARENT", parentId: "parent-b" }, { role: "PARENT" }, { role: "TEACHER" },
  ]) {
    f.session(session);
    await assert.rejects(f.actions.getReceiptDetails(payment.receiptNo), /FORBIDDEN/);
    await assert.rejects(f.actions.getStudentFeeDetails(student.id), /FORBIDDEN/);
  }
  for (const session of [
    { role: "STUDENT", studentId: student.id }, { role: "PARENT", parentId: student.parentId },
    { role: "SUPER_ADMIN" }, { role: "ADMIN" }, { role: "ACCOUNTANT" },
  ]) {
    f.session(session);
    const receipt = await f.actions.getReceiptDetails(payment.receiptNo);
    assert.equal(receipt.payment.studentId, student.id);
    assert.equal(receipt.institute.id, student.instituteId);
    assert.equal((await f.actions.getStudentFeeDetails(student.id)).length, 1);
  }
});

test("financial transaction retries serialization conflicts but not validation errors", async () => {
  let calls = 0;
  const module = load("src/lib/finance-transaction.ts", {
    "@/lib/db": { db: { $transaction: async (work, options) => {
      assert.equal(options.isolationLevel, "Serializable");
      if (++calls < 3) throw Object.assign(new Error("conflict"), { code: "P2034" });
      return work({});
    } } },
  });
  assert.equal(await module.financeTransaction(async () => "committed"), "committed");
  assert.equal(calls, 3);
  await assert.rejects(module.financeTransaction(async () => { throw new Error("validation"); }), /validation/);
  assert.equal(calls, 4);
});
