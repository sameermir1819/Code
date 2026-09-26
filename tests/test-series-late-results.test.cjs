const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function loadTestSeriesActions(db) {
  const file = path.join(root, "src/server/actions/test-series.ts");
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    Date,
    URL,
    console,
    require(id) {
      if (id === "@/lib/db") return { db };
      if (id === "@/lib/campus-scope") return { authorizedCampusId: () => "campus-a" };
      if (id === "@/server/actions/campus") return { getActiveCampusId: async () => "campus-a" };
      if (id === "@/lib/auth") return {
        requirePermission: async () => ({ id: "admin-1", name: "Admin", role: "ADMIN", instituteId: "campus-a" }),
        requireStaffPermission: async () => ({ id: "admin-1", name: "Admin", role: "ADMIN", instituteId: "campus-a" }),
        requireAuth: async () => ({ id: "admin-1", role: "ADMIN", instituteId: "campus-a" }),
        getEffectivePermissions: async () => [],
      };
      if (id === "@/lib/redact-related-data") return { redactRelatedData: (value) => value };
      if (id === "@/server/actions/portal") return { resolveCurrentStudent: async () => null };
      if (id === "next/cache") return { revalidatePath() {} };
      throw new Error(`Unexpected dependency: ${id}`);
    },
  }, { filename: file });
  return exports;
}

const lateResult = {
  registrationId: "late-registration",
  marksObtained: 80,
  maxMarks: 100,
  attendance: "PRESENT",
  correctCount: 20,
  incorrectCount: 5,
  unattemptedCount: 0,
  remarks: "Late registration",
};

function fixture(initial = []) {
  let rows = initial.map((row) => ({ updatedAt: new Date("2026-09-01"), ...row }));
  let revision = 0;
  const audits = [];
  const publishedAt = new Date("2026-09-01");
  const exam = { testSeriesId: "series-1", status: "RESULTS_PUBLISHED", resultsPublishedAt: publishedAt, maxMarks: 100 };
  let failRanking = false;
  const db = {
    testSeriesExam: { findFirst: async ({ where }) => {
      assert.equal(where.testSeries.instituteId, "campus-a");
      return where.id === "exam-1" ? exam : null;
    } },
    testSeriesRegistration: { findMany: async ({ where }) => {
      assert.equal(where.testSeriesId, "series-1");
      assert.equal(where.OR[1].student.instituteId, "campus-a");
      return where.id.in.filter((id) => id !== "foreign-registration").map((id) => ({ id }));
    } },
    $transaction: async (callback, options) => {
      assert.equal(options.isolationLevel, "Serializable");
      const pending = rows.map((row) => ({ ...row }));
      const pendingAudits = [];
      const tx = {
        auditLog: { create: async ({ data }) => { pendingAudits.push(data); } },
        testSeriesExam: { update: async () => { throw new Error("Existing publication metadata must remain intact"); } },
        testSeriesResult: {
          upsert: async ({ where, create, update }) => {
            assert.equal(where.testSeriesExamId_registrationId.testSeriesExamId, "exam-1");
            const current = pending.find((row) => row.registrationId === where.testSeriesExamId_registrationId.registrationId);
            if (current) Object.assign(current, Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)));
            else pending.push({ id: `result-${pending.length}`, ...create });
            pending.find((row) => row.registrationId === create.registrationId).updatedAt = new Date(1800000000000 + revision++);
          },
          findMany: async ({ where }) => pending.filter((row) => where.registrationId ? where.registrationId.in.includes(row.registrationId) : row.attendance === where.attendance).sort((a, b) => b.marksObtained - a.marksObtained).map((row) => ({ ...row })),
          update: async ({ where, data }) => {
            if (failRanking) throw new Error("Ranking failed");
            Object.assign(pending.find((row) => row.id === where.id), data, { updatedAt: new Date(1800000000000 + revision++) });
          },
        },
      };
      await callback(tx);
      rows = pending;
      audits.push(...pendingAudits);
    },
  };
  return { actions: loadTestSeriesActions(db), rows: () => rows, audits, version: (id) => rows.find((row) => row.registrationId === id)?.updatedAt.toISOString(), failRanking: () => { failRanking = true; } };
}

const previousResult = { id: "previous-result", registrationId: "previous", marksObtained: 90, attendance: "PRESENT", rank: 1, percentile: 100 };

test("late candidates can publish results and rankings include all candidates", async () => {
  const f = fixture([previousResult]);
  const result = await f.actions.submitTestResults("exam-1", [lateResult]);
  assert.equal(result.success, true);
  assert.equal(f.rows().length, 2);
  assert.equal(f.rows().find((row) => row.registrationId === "late-registration").rank, 2);
  assert.equal(f.rows().find((row) => row.registrationId === "previous").percentile, 50);
});

test("editing a published score updates that row and reranks existing candidates", async () => {
  const f = fixture([previousResult]);
  await f.actions.submitTestResults("exam-1", [lateResult]);
  const result = await f.actions.submitTestResults("exam-1", [{ ...lateResult, marksObtained: 95, maxMarks: 1000, remarks: "Corrected", expectedUpdatedAt: f.version("late-registration") }]);
  assert.equal(result.success, true);
  assert.equal(f.rows().length, 2);
  const edited = f.rows().find((row) => row.registrationId === "late-registration");
  assert.equal(edited.marksObtained, 95);
  assert.equal(edited.maxMarks, 100);
  assert.equal(edited.percentage, 95);
  assert.equal(edited.remarks, "Corrected");
  assert.equal(edited.rank, 1);
  assert.equal(f.rows().find((row) => row.registrationId === "previous").rank, 2);
});

test("attendance corrections clear absent scores and ranks and update remaining ranks", async () => {
  const f = fixture([previousResult]);
  await f.actions.submitTestResults("exam-1", [lateResult]);
  const result = await f.actions.submitTestResults("exam-1", [{ ...lateResult, attendance: "ABSENT", expectedUpdatedAt: f.version("late-registration") }]);
  assert.equal(result.success, true);
  const absent = f.rows().find((row) => row.registrationId === "late-registration");
  assert.equal(absent.marksObtained, 0);
  assert.equal(absent.percentage, 0);
  assert.equal(absent.rank, null);
  assert.equal(absent.percentile, null);
  assert.equal(absent.correctCount, null);
  assert.equal(f.rows()[0].percentile, 100);
});

test("tied edited scores share a rank and omitted subject details are preserved", async () => {
  const f = fixture([{ ...previousResult, subjectBreakup: '{"physics":45}', negativeMarks: 2 }]);
  await f.actions.submitTestResults("exam-1", [lateResult]);
  const result = await f.actions.submitTestResults("exam-1", [{ ...lateResult, registrationId: "previous", expectedUpdatedAt: f.version("previous") }]);
  assert.equal(result.success, true);
  assert.ok(f.rows().every((row) => row.rank === 1));
  assert.equal(f.rows()[0].subjectBreakup, '{"physics":45}');
  assert.equal(f.rows()[0].negativeMarks, 2);
});

test("a failed rank recalculation rolls back score edits", async () => {
  const f = fixture([previousResult]);
  f.failRanking();
  const result = await f.actions.submitTestResults("exam-1", [{ ...lateResult, registrationId: "previous", expectedUpdatedAt: f.version("previous") }]);
  assert.equal(result.success, false);
  assert.equal(f.rows()[0].marksObtained, 90);
  assert.equal(f.audits.length, 0);
});

test("stale editor and stale new-result requests cannot overwrite newer scores", async () => {
  const f = fixture([previousResult]);
  const originalVersion = f.version("previous");
  assert.equal((await f.actions.submitTestResults("exam-1", [{ ...lateResult, registrationId: "previous", expectedUpdatedAt: originalVersion }])).success, true);
  const stale = await f.actions.submitTestResults("exam-1", [{ ...lateResult, registrationId: "previous", marksObtained: 45, expectedUpdatedAt: originalVersion }]);
  assert.equal(stale.success, false);
  assert.match(stale.error, /changed since you opened/);
  assert.equal((await f.actions.submitTestResults("exam-1", [{ ...lateResult, registrationId: "previous" }])).success, false);
  assert.equal(f.rows()[0].marksObtained, 80);
  assert.equal(f.audits.length, 1);
  const details = JSON.parse(f.audits[0].details);
  assert.equal(details.before[0].marksObtained, 90);
  assert.equal(details.submitted[0].marksObtained, 80);
  assert.equal(f.audits[0].userId, "admin-1");
});

test("malformed result payloads are rejected before any writes", async () => {
  const f = fixture();
  for (const payload of [null, {}, [null], [{ ...lateResult, remarks: 123 }], [{ ...lateResult, negativeMarks: Infinity }], [{ ...lateResult, expectedUpdatedAt: "invalid" }], [{ ...lateResult, subjectBreakup: { physics: NaN } }], [lateResult, lateResult]]) {
    assert.equal((await f.actions.submitTestResults("exam-1", payload)).success, false);
  }
  assert.equal(f.rows().length, 0);
  assert.equal(f.audits.length, 0);
});

test("foreign registrations and exams cannot be edited", async () => {
  const f = fixture([previousResult]);
  assert.equal((await f.actions.submitTestResults("exam-1", [{ ...lateResult, registrationId: "foreign-registration" }])).success, false);
  assert.equal((await f.actions.submitTestResults("foreign-exam", [lateResult])).success, false);
  assert.equal(f.rows().length, 1);
});

test("the exam maximum is authoritative and out-of-range late scores are rejected", async () => {
  let transactions = 0;
  const db = {
    testSeriesExam: { findFirst: async () => ({ testSeriesId: "series-1", status: "RESULTS_PUBLISHED", resultsPublishedAt: new Date(), maxMarks: 50 }) },
    testSeriesRegistration: { findMany: async () => [{ id: "late-registration" }] },
    testSeriesResult: { findMany: async () => [] },
    $transaction: async () => { transactions++; },
  };

  const actions = loadTestSeriesActions(db);
  const result = await actions.submitTestResults("exam-1", [{ ...lateResult, marksObtained: 80, maxMarks: 100 }]);

  assert.equal(result.success, false);
  assert.match(result.error, /between 0 and 50/i);
  assert.equal(transactions, 0);
});
