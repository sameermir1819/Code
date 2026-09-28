const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, mocks = {}, Clock = Date) {
  mocks = require("./auth-mock.cjs").withAuthorizationMocks(mocks);
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Date: Clock, Intl, console, crypto: require("node:crypto").webcrypto, require(id) {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    throw new Error(`Unexpected dependency ${id}`);
  } });
  return exports;
}
const scanner = load("src/lib/attendance-scanner.ts");
const campusScope = load("src/lib/campus-scope.ts");

test("each physical scan gets a unique retry-safe request identifier", () => {
  const first = scanner.createScanRequestId();
  assert.match(first, /^[a-f0-9]{32}$/);
  assert.notEqual(scanner.createScanRequestId(), first);
});

test("scanner reads printed student cards, admission codes and legacy JSON", () => {
  for (const payload of ["STU-2026-0001", " STU-2026-0001\r\n", '{"studentId":"STU-2026-0001"}', '{"code":"STU-2026-0001"}', '{"id":"STU-2026-0001"}']) {
    assert.equal(scanner.parseStudentCard(payload), "STU-2026-0001");
  }
  assert.equal(scanner.parseStudentCard("ADM-2026-0001"), "ADM-2026-0001");
});

test("malformed scanner input is rejected", () => {
  for (const payload of ["", "   ", null, "null", "[]", "{}", '{"studentId":17}', '{"studentId":{"id":"student"}}', "https://example.invalid", "a".repeat(1025)]) {
    assert.throws(() => scanner.parseStudentCard(payload), /Invalid card/);
  }
});

test("attendance day rolls over at midnight in India, independently of server timezone", () => {
  const before = scanner.attendanceDay(new Date("2026-09-24T18:29:59Z"));
  const after = scanner.attendanceDay(new Date("2026-09-24T18:30:00Z"));
  assert.equal(before.start.toISOString(), "2026-09-23T18:30:00.000Z");
  assert.equal(before.end.toISOString(), after.start.toISOString());
  assert.equal(after.end.toISOString(), "2026-09-25T18:30:00.000Z");
});

function fixture() {
  let clock = new Date("2026-09-24T04:00:00Z").getTime();
  class TestDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return clock; }
  }
  let actor = { role: "ADMIN", name: "Gate Operator" };
  let campus = "campus-a";
  let rows = [];
  let student = {
    id: "s", studentId: "STU-A", name: "Test Student", instituteId: campus, status: "ACTIVE",
    enrollments: [{ batch: { id: "batch-a", name: "Batch A" } }],
  };
  let writes = 0;
  let logs = 0;
  const campuses = [
    { id: "campus-a", name: "Campus A", code: "A" },
    { id: "campus-b", name: "Campus B", code: "B" },
  ];
  const queries = {};
  const db = {
    institute: { findMany: async ({ where }) => campuses.filter((item) => !where.id || item.id === where.id) },
    batch: { findFirst: async () => ({ id: "batch-b", name: "Batch B", instituteId: "campus-b" }) },
    student: {
      findFirst: async ({ where }) => student && where.instituteId === student.instituteId ? student : null,
      findMany: async ({ where }) => { queries.defaulters = where; return []; },
    },
    attendance: {
      findFirst: async ({ where }) => rows.find((r) => r.studentId === where.studentId && r.batchId === where.batchId && r.date >= where.date.gte && r.date < where.date.lt) || null,
      create: async ({ data }) => {
        writes++;
        const row = { id: `a-${rows.length}`, checkInAt: null, checkOutAt: null, checkInScanId: null, checkOutScanId: null, ...data, createdAt: new Date(clock), updatedAt: new Date(clock) };
        rows.push(row);
        return row;
      },
      update: async ({ where, data }) => {
        writes++;
        const row = rows.find((r) => r.id === where.id);
        Object.assign(row, data, { updatedAt: new Date(clock) });
        return row;
      },
      findMany: async ({ where }) => {
        queries.feed = where;
        assert.ok(where.batch.instituteId);
        assert.deepEqual(Array.from(where.status.in), ["PRESENT", "LATE"]);
        return [];
      },
    },
    $transaction: async (work, options) => {
      assert.equal(options.isolationLevel, "Serializable");
      return work(db);
    },
  };
  const actions = load("src/server/actions/attendance.ts", {
    "@/lib/db": { db },
    "@/lib/auth": { requireAuth: async (roles) => {
      if (!actor || (roles && !roles.includes(actor.role))) throw new Error("FORBIDDEN");
      return actor;
    } },
    "@/lib/campus-scope": campusScope,
    "./audit": { logAudit: async () => { logs++; } },
    "./campus": { getActiveCampusId: async () => campus },
    "@/lib/attendance-scanner": scanner, "date-fns": require("date-fns"),
    "node:crypto": require("node:crypto"),
  }, TestDate);
  return {
    actions, db, student, queries, rows: () => rows, writes: () => writes, logs: () => logs,
    actor: (value) => { actor = value; }, campus: (value) => { campus = value; },
    advance: (seconds) => { clock += seconds * 1000; },
  };
}

test("card scan records attendance once and preserves the original check-in on repeat", async () => {
  const f = fixture();
  const first = await f.actions.recordQrAttendance("STU-A");
  const repeat = await f.actions.recordQrAttendance('{"studentId":"STU-A"}');
  assert.equal(first.isAlreadyMarked, false);
  assert.equal(repeat.isAlreadyMarked, true);
  assert.equal(repeat.record.status, "PRESENT");
  assert.equal(repeat.record.markedBy, "Gate Operator");
  assert.equal(repeat.checkInTime, first.checkInTime);
  assert.equal(f.rows().length, 1);
  assert.equal(f.writes(), 1);
  assert.equal(f.logs(), 1);
});

test("late marks remain late on repeated card scan", async () => {
  const f = fixture();
  const { record } = await f.actions.recordQrAttendance("STU-A");
  record.status = "LATE";
  const result = await f.actions.recordQrAttendance("STU-A");
  assert.equal(result.isAlreadyMarked, true);
  assert.equal(result.record.status, "LATE");
  assert.equal(f.writes(), 1);
});

test("arrival updates an existing absence without making a second daily record", async () => {
  const f = fixture();
  const { record } = await f.actions.recordQrAttendance("STU-A");
  record.status = "ABSENT";
  record.checkInAt = null;
  record.checkInScanId = null;
  const result = await f.actions.recordQrAttendance("STU-A");
  assert.equal(result.isAlreadyMarked, false);
  assert.equal(result.record.status, "PRESENT");
  assert.equal(f.rows().length, 1);
});

test("students, parents, and anonymous callers cannot mark or read the gate feed", async () => {
  for (const actor of [null, { role: "STUDENT" }, { role: "PARENT" }]) {
    const f = fixture(); f.actor(actor);
    await assert.rejects(f.actions.recordQrAttendance("STU-A"), /FORBIDDEN/);
    await assert.rejects(f.actions.getTodayAttendanceLiveFeed(), /FORBIDDEN/);
    assert.equal(f.writes(), 0);
  }
});

test("inactive students, wrong campuses, and students without a batch cannot check in", async () => {
  const f = fixture();
  f.student.status = "INACTIVE";
  await assert.rejects(f.actions.recordQrAttendance("STU-A"), /inactive/);
  f.student.status = "ACTIVE";
  f.campus("other-campus");
  await assert.rejects(f.actions.recordQrAttendance("STU-A"), /not recognised/);
  f.campus("campus-a");
  f.student.enrollments = [];
  await assert.rejects(f.actions.recordQrAttendance("STU-A"), /active batch/);
  assert.equal(f.writes(), 0);
});

test("scanner UI receives the real operational reason instead of a redacted server error", async () => {
  const f = fixture();
  f.student.status = "INACTIVE";
  const result = await f.actions.recordQrAttendanceSafe("STU-A");
  assert.equal(result.success, false);
  assert.match(result.error, /inactive/i);
  assert.equal(f.writes(), 0);
});

test("retry after a competing scan sees the committed record and does not write twice", async () => {
  const f = fixture();
  const transaction = f.db.$transaction;
  let competing = true;
  f.db.$transaction = async (work, options) => {
    if (competing) {
      competing = false;
      await f.actions.recordQrAttendance("STU-A");
      throw Object.assign(new Error("concurrent scan"), { code: "P2034" });
    }
    return transaction(work, options);
  };
  const result = await f.actions.recordQrAttendance("STU-A");
  assert.equal(result.isAlreadyMarked, true);
  assert.equal(f.rows().length, 1);
  assert.equal(f.writes(), 1);
});

test("gate feed follows the explicitly selected attendance campus", async () => {
  const f = fixture();
  await f.actions.getTodayAttendanceLiveFeed("campus-b");
  assert.equal(f.queries.feed.batch.instituteId, "campus-b");
});

test("attendance selection overrides the unrelated ERP campus cookie", async () => {
  const f = fixture();
  f.campus("campus-b");
  const scan = await f.actions.recordQrAttendanceSafe("STU-A", "campus-scan", "campus-a");
  assert.equal(scan.success, true);
  assert.equal(f.writes(), 1);
  await f.actions.getAttendanceDefaulters(75, "campus-a");
  assert.equal(f.queries.defaulters.instituteId, "campus-a");
});

test("campus options and backend checks restrict assigned staff", async () => {
  const f = fixture();
  f.actor({ id: "gate-staff", role: "ADMIN", instituteId: "campus-a", name: "Gate Operator" });
  const options = await f.actions.getAttendanceCampuses();
  assert.deepEqual(Array.from(options.campuses, item => item.id), ["campus-a"]);
  assert.equal(options.selectedCampusId, "campus-a");
  const scan = await f.actions.recordQrAttendanceSafe("STU-A", "foreign-scan", "campus-b");
  assert.equal(scan.success, false);
  assert.equal(f.writes(), 0);
  await assert.rejects(f.actions.getTodayAttendanceLiveFeed("campus-b"), /permission/);
  await assert.rejects(f.actions.getAttendanceDefaulters(75, "campus-b"), /permission/);
  await assert.rejects(f.actions.getBatchAttendanceForDate("batch-b", "2026-09-24"), /permission/);
  await assert.rejects(f.actions.getMonthlyAttendanceReport("batch-b", 9, 2026), /permission/);
  assert.equal(f.queries.feed, undefined);
  assert.equal(f.queries.defaulters, undefined);
});

test("central staff can choose campuses and must make an explicit initial selection", async () => {
  const f = fixture();
  f.actor({ id: "central", role: "SUPER_ADMIN", instituteId: "campus-a" });
  const options = await f.actions.getAttendanceCampuses();
  assert.deepEqual(Array.from(options.campuses, item => item.id), ["campus-a", "campus-b"]);
  assert.equal(options.selectedCampusId, "");
});

test("later scan checks out while keeping attendance and the original check-in", async () => {
  const f = fixture();
  const entry = await f.actions.recordQrAttendance("STU-A", "entry-1");
  const checkIn = entry.record.checkInAt.toISOString();
  f.advance(3600);
  const exit = await f.actions.recordQrAttendance("STU-A", "exit-1");
  assert.equal(exit.action, "CHECK_OUT");
  assert.equal(exit.isAlreadyMarked, false);
  assert.equal(exit.record.checkInAt.toISOString(), checkIn);
  assert.equal(exit.record.checkOutAt.toISOString(), "2026-09-24T05:00:00.000Z");
  assert.equal(exit.record.status, "PRESENT");
  assert.equal(f.rows().length, 1);
  assert.equal(f.logs(), 2);
});

test("60-second duplicate guard applies across different request IDs", async () => {
  const f = fixture();
  await f.actions.recordQrAttendance("STU-A", "entry-1");
  f.advance(59);
  const duplicate = await f.actions.recordQrAttendance("STU-A", "noise-1");
  assert.equal(duplicate.isAlreadyMarked, true);
  assert.equal(duplicate.record.checkOutAt, null);
  f.advance(1);
  const exit = await f.actions.recordQrAttendance("STU-A", "exit-1");
  assert.equal(exit.action, "CHECK_OUT");
  assert.equal(exit.isAlreadyMarked, false);
});

test("retrying the same check-in after cooldown cannot check the student out", async () => {
  const f = fixture();
  await f.actions.recordQrAttendance("STU-A", "same-request");
  f.advance(180);
  const retry = await f.actions.recordQrAttendance("STU-A", "same-request");
  assert.equal(retry.action, "CHECK_IN");
  assert.equal(retry.isAlreadyMarked, true);
  assert.equal(retry.record.checkOutAt, null);
  assert.equal(f.writes(), 1);
});

test("scans after checkout preserve both times and do not create a new entry", async () => {
  const f = fixture();
  await f.actions.recordQrAttendance("STU-A", "entry-1");
  f.advance(60);
  const exit = await f.actions.recordQrAttendance("STU-A", "exit-1");
  const checkOut = exit.record.checkOutAt.toISOString();
  f.advance(300);
  for (const id of ["exit-1", "extra-scan", "entry-1"]) {
    const repeated = await f.actions.recordQrAttendance("STU-A", id);
    assert.equal(repeated.isAlreadyMarked, true);
    assert.equal(repeated.record.checkOutAt.toISOString(), checkOut);
  }
  assert.equal(f.writes(), 2);
  assert.equal(f.rows().length, 1);
});

test("next-day scan starts a new visit without inventing yesterday's missing checkout", async () => {
  const f = fixture();
  await f.actions.recordQrAttendance("STU-A");
  f.advance(24 * 3600);
  const next = await f.actions.recordQrAttendance("STU-A");
  assert.equal(next.action, "CHECK_IN");
  assert.equal(next.isAlreadyMarked, false);
  assert.equal(f.rows().length, 2);
  assert.equal(f.rows()[0].checkOutAt, null);
});

test("manual late attendance acquires a real check-in on first physical scan", async () => {
  const f = fixture();
  const { record } = await f.actions.recordQrAttendance("STU-A");
  record.status = "LATE";
  record.checkInAt = null;
  record.checkInScanId = null;
  f.advance(60);
  const result = await f.actions.recordQrAttendance("STU-A");
  assert.equal(result.action, "CHECK_IN");
  assert.equal(result.record.status, "LATE");
  assert.equal(result.record.checkInAt.toISOString(), "2026-09-24T04:01:00.000Z");
  assert.equal(result.record.checkOutAt, null);
});

test("GPS endpoint and server actions are removed", () => {
  assert.equal(fs.existsSync(path.join(__dirname, "../src/app/api/attendance/geo-checkin/route.ts")), false);
  const f = fixture();
  assert.equal(f.actions.recordGeoCheckIn, undefined);
  assert.equal(f.actions.getCampusGeofenceConfig, undefined);
});
