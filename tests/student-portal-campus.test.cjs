const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks) {
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    console: { error() {} },
    require(id) {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      throw new Error('Missing mock: ' + id);
    },
  }, { filename: file });
  return exports;
}

const student = {
  id: 'student-one',
  instituteId: 'campus-one',
  name: 'Student One',
  studentId: 'STU-001',
  admissionNo: 'ADM-001',
};

function portalMocks({ session = { id: 'student-user', role: 'STUDENT' }, db = {} } = {}) {
  return {
    '@/lib/auth': {
      requireAuth: async () => session,
      requirePermission: async () => session,
      requireStaffPermission: async () => session,
      getEffectivePermissions: async () => [
        'batches.view',
        'timetable.view',
        'attendance.view',
        'fees.view',
        'results.view',
        'materials.view',
        'announcements.view',
      ],
      verifyPassword: async () => true,
      hashPassword: async () => 'hash',
    },
    '@/lib/db': { db },
    '@/lib/redact-related-data': { redactRelatedData: (value) => value },
    'next/cache': { revalidatePath() {} },
    react: { cache: (callback) => callback },
    './campus': { getActiveCampusId: async () => 'campus-two' },
  };
}

test('staff portal preview fetches only active students from the selected campus', async () => {
  let query;
  const api = load('src/server/actions/portal.ts', portalMocks({
    session: { id: 'admin', role: 'SUPER_ADMIN' },
    db: { student: { findFirst: async (args) => { query = args; return null; } } },
  }));

  await api.resolveCurrentStudent();

  assert.equal(query.where.instituteId, 'campus-two');
  assert.equal(query.where.status, 'ACTIVE');
});

test('student overview scopes related records and announcements to enrolled campus content', async () => {
  const queries = {};
  const db = {
    student: { findFirst: async () => student },
    enrollment: { findMany: async () => [] },
    attendance: { findMany: async ({ where }) => { queries.attendance = where; return []; } },
    feePlan: { findMany: async () => [] },
    payment: { findMany: async () => [] },
    marks: { findMany: async ({ where }) => { queries.marks = where; return []; } },
    announcement: { findMany: async ({ where }) => { queries.announcements = where; return []; } },
    studyMaterial: { count: async () => 0 },
  };
  const api = load('src/server/actions/portal.ts', portalMocks({ db }));

  await api.getStudentPortalOverview();

  assert.deepEqual(JSON.parse(JSON.stringify(queries.attendance)), {
    studentId: student.id,
    batch: { instituteId: student.instituteId },
  });
  assert.deepEqual(JSON.parse(JSON.stringify(queries.marks)), {
    studentId: student.id,
    exam: { batch: { instituteId: student.instituteId } },
  });
  assert.deepEqual(JSON.parse(JSON.stringify(queries.announcements)), {
    AND: [
      { targetRole: { in: ['STUDENT', 'ALL'] } },
      { OR: [{ batchId: null, courseId: null }] },
    ],
  });
});

test('student portal only lists test series from the student campus', async () => {
  const queries = {};
  const seriesMocks = {
    '@/lib/auth': {
      requirePermission: async () => {},
      requireAuth: async () => ({ id: 'student-user', role: 'STUDENT' }),
    },
    '@/lib/db': {
      db: {
        testSeriesRegistration: {
          findMany: async ({ where }) => { queries.registrations = where; return []; },
        },
        testSeries: {
          findMany: async ({ where }) => { queries.available = where; return []; },
        },
      },
    },
    '@/lib/redact-related-data': { redactRelatedData: (value) => value },
    '@/server/actions/portal': { resolveCurrentStudent: async () => ({ student }) },
    'next/cache': { revalidatePath() {} },
    '@/lib/campus-scope': { authorizedCampusId: (_session, campusId) => campusId },
    '@/server/actions/campus': { getActiveCampusId: async () => 'campus-two' },
  };
  const api = load('src/server/actions/test-series.ts', seriesMocks);

  await api.getStudentPortalTestSeries();

  assert.deepEqual(JSON.parse(JSON.stringify(queries.registrations)), {
    studentId: student.id,
    testSeries: { is: { instituteId: student.instituteId } },
  });
  assert.equal(queries.available.instituteId, student.instituteId);
  assert.equal(queries.available.status, 'ACTIVE');
});
