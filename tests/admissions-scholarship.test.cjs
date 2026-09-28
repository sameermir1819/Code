const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function fixture({ receiptConflicts = 0 } = {}) {
  const saved = { enrollment: null, feePlan: null, installments: [], activeEnrollmentCount: 0, transactionAttempts: 0 };
  const session = { id: "admin", name: "Admissions Admin", role: "ADMIN", instituteId: "campus-a" };
  const tx = {
    $executeRaw: async () => 1,
    parent: {
      findFirst: async () => ({ id: "parent-a" }),
      create: async ({ data }) => ({ id: "parent-a", ...data }),
    },
    student: {
      create: async ({ data }) => ({ id: "student-a", studentId: "HAW-26-001", admissionNo: "ADM-HAW-26-001", ...data }),
    },
    enrollment: {
      count: async () => saved.activeEnrollmentCount,
      create: async ({ data }) => { saved.enrollment = data; return { id: "enrollment-a", ...data }; },
    },
    feePlan: {
      create: async ({ data }) => { saved.feePlan = data; return { id: "plan-a", ...data }; },
    },
    feeInstallment: {
      create: async ({ data }) => { saved.installments.push(data); return data; },
    },
    payment: { create: async ({ data }) => ({ id: "payment-a", ...data }) },
  };
  const db = {
    batch: { findFirst: async () => ({ id: "batch-a", name: "Scholar Batch", capacity: 40, courseId: "course-a", course: { id: "course-a", name: "NEET" } }) },
    $transaction: async (callback, options) => {
      saved.transactionAttempts++;
      assert.equal(options.isolationLevel, "Serializable");
      if (receiptConflicts-- > 0) {
        const error = new Error("Unique constraint");
        error.code = "P2002";
        error.meta = { target: ["receiptNo"] };
        throw error;
      }
      return callback(tx);
    },
  };
  const source = fs.readFileSync(path.join(__dirname, "../src/server/actions/admissions.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    Date,
    Number,
    require(id) {
      const mocks = {
        "@/lib/auth": { requireStaffPermission: async () => session },
        "@/lib/db": { db },
        "./audit": { logAudit: async () => {} },
        "./campus": { getActiveCampusId: async () => "campus-a" },
        "@/lib/student-user": { createStudentUser: async () => {} },
        "@/lib/campus-scope": { authorizedCampusId: (_actor, campusId) => campusId },
        "@/lib/student-identifiers": { allocateStudentIdentifiers: async () => ({ studentId: "HAW-26-001", admissionNo: "ADM-HAW-26-001" }) },
        "@/lib/payment-receipts": { allocatePaymentReceiptNumber: async () => "REC-2026-0001" },
        "@/lib/finance-transaction": { roundMoney: (value) => Math.round((value + Number.EPSILON) * 100) / 100 },
      };
      if (!(id in mocks)) throw new Error(`Unexpected dependency ${id}`);
      return mocks[id];
    },
  });
  return { actions: exports, saved };
}

const payload = {
  name: "Scholar Student",
  gender: "FEMALE",
  parentName: "Parent",
  parentPhone: "9999999999",
  campusId: "campus-a",
  batchId: "batch-a",
  admissionSource: "SCHOLARSHIP_TEST",
  scholarshipTestName: "Futurex Talent Search",
  scholarshipTestDate: "2026-09-20",
  scholarshipRollNumber: "sch-001",
  scholarshipMarks: 75,
  scholarshipMaxMarks: 100,
  scholarshipRank: 4,
  admissionFee: 100,
  tuitionFee: 100,
  materialFee: 100,
  examFee: 100,
  discountAmount: 100,
  installmentCount: 3,
  initialPaymentAmount: 100,
  paymentMethod: "UPI",
};

test("scholarship admission stores the test result and balanced fee installments", async () => {
  const f = fixture();
  const result = await f.actions.processAdmission(payload);

  assert.equal(result.success, true);
  assert.equal(result.rollNumber, "HAW-26-001");
  assert.equal(result.admissionSource, "SCHOLARSHIP_TEST");
  assert.equal(result.scholarshipPercentage, 75);
  assert.equal(f.saved.enrollment.source, "SCHOLARSHIP_TEST");
  assert.equal(f.saved.enrollment.scholarshipRollNumber, "SCH-001");
  assert.equal(f.saved.enrollment.scholarshipPercentage, 75);
  assert.equal(f.saved.feePlan.discountAmount, 100);
  assert.equal(f.saved.installments.reduce((sum, installment) => sum + installment.amount, 0), 300);
  assert.equal(f.saved.installments.reduce((sum, installment) => sum + installment.paidAmount, 0), 100);
  assert.equal(f.saved.installments.reduce((sum, installment) => sum + installment.remainingAmount, 0), 200);
});

test("scholarship admission rejects impossible scores and fee overpayment before writing", async () => {
  const f = fixture();
  assert.match((await f.actions.processAdmission({ ...payload, scholarshipMarks: 101 })).error, /marks must be between zero and the maximum/i);
  assert.match((await f.actions.processAdmission({ ...payload, initialPaymentAmount: 301 })).error, /cannot exceed the final fee/i);
  assert.equal(f.saved.enrollment, null);
});

test("admissions reject rolled-over dates, future birth dates and unsupported types", async () => {
  for (const changes of [
    { scholarshipTestDate: "2026-02-30" },
    { admissionDate: "2026-02-29" },
    { paymentDate: "not-a-date" },
    { dob: "2027-01-01", admissionDate: "2026-09-28" },
    { admissionSource: "UNKNOWN" },
    { tuitionFee: Number.MAX_SAFE_INTEGER },
  ]) {
    const f = fixture();
    assert.equal((await f.actions.processAdmission({ ...payload, ...changes })).success, false);
    assert.equal(f.saved.enrollment, null);
  }
});

test("a full batch returns its actual capacity error instead of a redacted server-render error", async () => {
  const f = fixture();
  f.saved.activeEnrollmentCount = 40;
  const result = await f.actions.processAdmission(payload);
  // The fixture batch capacity defaults below the occupied test value.
  assert.equal(result.success, false);
  assert.match(result.error, /batch.*full/i);
});

test("receipt number conflicts retry automatically without asking staff to resubmit", async () => {
  const f = fixture({ receiptConflicts: 1 });
  const result = await f.actions.processAdmission(payload);
  assert.equal(result.success, true);
  assert.equal(result.receiptNo, "REC-2026-0001");
  assert.equal(f.saved.transactionAttempts, 2);
});
