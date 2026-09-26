const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Actual application modules, isolated database/filesystem adapters. No live data writes.
function load(file, mocks = {}) {
  mocks = require("./auth-mock.cjs").withAuthorizationMocks(mocks);
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports, Buffer, URL, Date, TextEncoder, console: { error() {} },
    process: { cwd: () => process.cwd(), env: { NODE_ENV: 'test', JWT_SECRET: 'test-secret-for-isolated-tests-32-chars' } },
    require(id) {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (['path', 'crypto', 'fs/promises', 'next/server', 'jose', 'bcryptjs'].includes(id)) return require(id);
      throw new Error('Missing mock: ' + id);
    },
  }, { filename: file });
  return exports;
}
const scope = load('src/lib/campus-scope.ts');
const clean = (value) => JSON.parse(JSON.stringify(value));

test('assigned campus overrides forged selection; central staff must select a campus', () => {
  assert.equal(scope.authorizedCampusId({ role: 'ADMIN', instituteId: 'own' }, 'foreign'), 'own');
  assert.equal(scope.authorizedCampusId({ role: 'SUPER_ADMIN', instituteId: 'own' }, 'selected'), 'selected');
  assert.throws(() => scope.authorizedCampusId({ role: 'ADMIN' }, 'ALL'));
  assert.throws(() => scope.authorizedCampusId({ role: 'ADMIN' }, ''));
});

for (const role of [null, 'STUDENT', 'PARENT', 'UNKNOWN', 'TEACHER', 'ACCOUNTANT', 'ADMIN', 'COUNSELOR']) {
  test('quick search respects role and campus: ' + role, async () => {
    const calls = [];
    const db = Object.fromEntries(['student', 'batch', 'payment', 'teacher'].map(model => [model, {
      findMany: async (query) => { calls.push({ model, query }); return []; },
    }]));
    const api = load('src/server/actions/search.ts', {
      '@/lib/db': { db }, '@/lib/auth': { getSession: async () => role ? { role, instituteId: 'own' } : null },
      './campus': { getActiveCampusId: async () => 'foreign' }, '@/lib/campus-scope': scope,
    });
    await api.globalQuickSearch('test');
    if ([null, 'STUDENT', 'PARENT', 'UNKNOWN'].includes(role)) return assert.equal(calls.length, 0);
    for (const { query } of calls) assert.equal(query.where.instituteId, undefined);
    assert.equal(calls.some(c => c.model === 'payment'), ['ADMIN', 'ACCOUNTANT'].includes(role));
    assert.equal(calls.some(c => c.model === 'teacher'), role === 'ADMIN');
    if (role === 'ADMIN') assert.equal(calls.find(c => c.model === 'teacher').query.where.status, 'ACTIVE');
  });
}

test('archiving a teacher removes active batch and timetable assignments', async () => {
  const events = [];
  const actor = { id: 'admin', name: 'Admin', role: 'SUPER_ADMIN' };
  const target = {
    id: 'teacher-user',
    name: 'Archived Teacher',
    email: 'teacher@example.invalid',
    role: 'TEACHER',
    student: null,
  };
  const teacher = { id: 'teacher-profile', userId: target.id };
  const tx = {
    user: { update: async (args) => events.push(['archive-user', args]) },
    teacher: {
      findFirst: async () => teacher,
      update: async (args) => events.push(['deactivate-teacher', args]),
    },
    teacherBatch: { deleteMany: async (args) => events.push(['remove-batch-assignments', args]) },
    timetableSlot: { deleteMany: async (args) => events.push(['remove-timetable-slots', args]) },
  };
  const api = load('src/server/actions/users.ts', {
    '@/lib/db': {
      db: {
        user: { findUnique: async () => target },
        $transaction: async (callback) => callback(tx),
      },
    },
    '@/lib/auth': { requirePermission: async () => actor },
    '@/lib/permissions': { ROLE_PERMISSIONS: {} },
    '@/lib/permission-catalog': { syncPermissionCatalog: async () => {} },
    '@/lib/student-user': { createStudentUser: async () => {} },
    './audit': { logAudit: async () => {} },
    './campus': { getActiveCampusId: async () => 'campus-a' },
    'next/cache': { revalidatePath: () => {} },
  });

  assert.deepEqual(clean(await api.archiveUser(target.id)), { success: true });
  assert.deepEqual(events.map(([name]) => name), [
    'archive-user',
    'remove-batch-assignments',
    'remove-timetable-slots',
    'deactivate-teacher',
  ]);
});

test('deleting a non-student user permanently removes the login account', async () => {
  const deleted = [];
  const audits = [];
  const actor = { id: 'admin', name: 'Admin', role: 'SUPER_ADMIN' };
  const target = {
    id: 'teacher-user',
    name: 'Teacher Login',
    email: 'teacher@example.invalid',
    role: 'TEACHER',
    student: null,
  };
  const api = load('src/server/actions/users.ts', {
    '@/lib/db': {
      db: {
        user: {
          findUnique: async () => target,
          delete: async (args) => deleted.push(args),
        },
      },
    },
    '@/lib/auth': { requirePermission: async () => actor },
    '@/lib/permissions': { ROLE_PERMISSIONS: {} },
    '@/lib/permission-catalog': { syncPermissionCatalog: async () => {} },
    '@/lib/student-user': { createStudentUser: async () => {} },
    './audit': { logAudit: async (event) => audits.push(event) },
    './campus': { getActiveCampusId: async () => 'campus-a' },
    'next/cache': { revalidatePath: () => {} },
  });

  assert.deepEqual(clean(await api.deleteUser(target.id)), { success: true });
  assert.deepEqual(clean(deleted), [{ where: { id: target.id } }]);
  assert.equal(audits[0].action, 'USER_DELETED');
});

test('moving a student campus without a batch leaves them intentionally unassigned', async () => {
  const enrollmentUpdates = [];
  const studentUpdates = [];
  const userUpdates = [];
  const actor = { id: 'admin', name: 'Admin', role: 'SUPER_ADMIN' };
  const tx = {
    student: {
      findFirst: async () => ({ instituteId: 'campus-a', userId: 'student-user' }),
      update: async (args) => {
        studentUpdates.push(args);
        return { id: 'student-a', studentId: 'STU-1', name: 'Student', ...args.data };
      },
    },
    enrollment: {
      findFirst: async () => ({ batchId: 'batch-a' }),
      updateMany: async (args) => enrollmentUpdates.push(args),
      create: async () => { throw new Error('no enrollment should be created'); },
    },
    batch: { findFirst: async () => null },
    user: { updateMany: async (args) => userUpdates.push(args) },
  };
  const api = load('src/server/actions/students.ts', {
    '@/lib/db': { db: { $transaction: async (callback) => callback(tx) } },
    '@/lib/auth': {
      requireStaffPermission: async () => actor,
      requireAuth: async () => actor,
      getEffectivePermissions: async () => [],
    },
    '@/lib/redact-related-data': { redactRelatedData: (value) => value },
    './audit': { logAudit: async () => {} },
    './campus': { getActiveCampusId: async () => 'campus-a' },
    '@/lib/student-user': { createStudentUser: async () => {} },
    '@/lib/campus-scope': scope,
    '@/lib/student-identifiers': { allocateStudentIdentifiers: async () => ({}) },
  });

  const result = await api.updateStudent('student-a', {
    instituteId: 'campus-b',
    batchId: '',
  });
  assert.equal(result.success, true);
  assert.equal(studentUpdates[0].data.instituteId, 'campus-b');
  assert.equal(userUpdates[0].data.instituteId, 'campus-b');
  assert.equal(enrollmentUpdates.length, 1);
  assert.equal(enrollmentUpdates[0].data.status, 'TRANSFERRED');
});

test('batch results omit archived teachers and their timetable slots', async () => {
  let query;
  const actor = { id: 'admin', name: 'Admin', role: 'SUPER_ADMIN' };
  const api = load('src/server/actions/academics.ts', {
    '@/lib/auth': {
      requireStaffPermission: async () => actor,
      getEffectivePermissions: async () => [],
    },
    '@/lib/db': { db: { batch: { findMany: async (args) => { query = args; return []; } } } },
    '@/lib/redact-related-data': { redactRelatedData: (value) => value },
    './audit': { logAudit: async () => {} },
    'next/cache': { revalidatePath: () => {} },
    './campus': { getActiveCampusId: async () => 'campus-a' },
    '@/lib/campus-scope': { authorizedCampusId: (_session, selectedCampusId) => selectedCampusId },
  });

  await api.getBatches({ status: 'ALL' });
  assert.equal(query.include.teachers.where.teacher.is.status, 'ACTIVE');
  assert.equal(query.include.timetableSlots.where.teacher.is.status, 'ACTIVE');
});

function campusFixture(counts, campusCount = 2, role = 'SUPER_ADMIN') {
  const events = [];
  const tx = {
    $queryRaw: async () => events.push('lock'),
    institute: {
      count: async () => { events.push('count'); return campusCount; },
      findUnique: async () => ({ name: 'Empty', code: 'E', _count: counts }),
      delete: async () => events.push('delete'),
    },
  };
  const api = load('src/server/actions/campus.ts', {
    '@/lib/db': { db: { $transaction: async (fn, options) => { assert.equal(options.isolationLevel, 'ReadCommitted'); return fn(tx); } } },
    '@/lib/auth': { getSession: async () => ({ role, instituteId: 'own' }) },
    'next/headers': { cookies: async () => ({ get: () => null }) },
    'next/cache': { revalidatePath() {} }, react: { cache: fn => fn },
  });
  return { api, events };
}
for (const relation of ['students', 'batches', 'users', 'academicSessions', 'courses', 'teachers', 'auditLogs', 'leads', 'testSeries']) {
  test('campus with ' + relation + ' cannot be deleted', async () => {
    const f = campusFixture({ [relation]: 1 });
    assert.equal((await f.api.deleteCampus('own')).success, false);
    assert.equal(f.events.includes('delete'), false);
  });
}
test('only empty campuses may be deleted; final campus and foreign campus are protected', async () => {
  const empty = campusFixture({ students: 0 });
  assert.equal((await empty.api.deleteCampus('own')).success, true);
  assert.deepEqual(empty.events, ['lock', 'count', 'delete']);
  const last = campusFixture({}, 1);
  assert.equal((await last.api.deleteCampus('own')).success, false);
  const foreign = campusFixture({}, 2, 'ADMIN');
  assert.equal((await foreign.api.deleteCampus('foreign')).success, false);
  const teacher = campusFixture({}, 2, 'TEACHER');
  await assert.rejects(() => teacher.api.deleteCampus('own'), /FORBIDDEN/);
  assert.deepEqual(teacher.events, []);
});

test('partial and full refunds preserve gross and calculate net once, with separate refund dates', async () => {
  let refund = 40;
  const queries = [];
  const db = {
    payment: { aggregate: async ({ where }) => {
      queries.push(where);
      assert.deepEqual(clean(where.status.in), ['SUCCESS', 'ADJUSTED', 'REFUNDED']);
      assert.equal(where.student.instituteId, 'own');
      return { _sum: { amount: 100 }, _count: 1 };
    } },
    refundAdjustment: { aggregate: async ({ where }) => { queries.push(where); assert.equal(where.payment.student.instituteId, 'own'); return { _sum: { amount: refund } }; } },
  };
  const api = load('src/lib/collection-totals.ts', { './db': { db } });
  assert.deepEqual(clean(await api.collectionTotals('own')), { gross: 100, refunds: 40, net: 60, count: 1 });
  refund = 100;
  assert.equal((await api.collectionTotals('own')).net, 0);
  const dates = { gte: new Date('2026-09-01') };
  await api.collectionTotals('own', dates);
  assert.equal(queries.at(-2).paymentDate, dates);
  assert.equal(queries.at(-1).refundDate, dates);
  assert.equal(queries.at(-1).payment.paymentDate, undefined);
  assert.equal(api.indiaMonthStart(new Date('2026-09-30T19:00:00Z')).toISOString(), '2026-09-30T18:30:00.000Z');
});

const uploads = load('src/lib/private-uploads.ts');
test('upload validation rejects executable formats, spoofed extensions and traversal', () => {
  for (const name of ['x.svg', 'x.html', 'x.exe', 'x.json']) assert.throws(() => uploads.validateUpload(name, Buffer.from('<script>bad</script>')));
  assert.throws(() => uploads.validateUpload('x.pdf', Buffer.from('<html>not a PDF</html>')));
  assert.equal(uploads.validateUpload('notes.pdf', Buffer.from('%PDF-1.7 test')).mime, 'application/pdf');
  assert.equal(uploads.validateUpload('notes.txt', Buffer.from('Notes')).type, 'DOCUMENT');
  for (const parts of [[], ['..', 'uploads-backup', 'private.txt'], ['materials', '../secret'], ['materials', 'C:\\secret'], ['materials', 'x.json\r\nHeader']]) assert.throws(() => uploads.uploadPath(uploads.uploadRoot, parts));
});
test('symlinks cannot escape the private upload root', async () => {
  const api = load('src/lib/private-uploads.ts', { 'fs/promises': { realpath: async value => value.endsWith('x.pdf') ? path.resolve('outside/x.pdf') : value } });
  await assert.rejects(() => api.existingUploadPath(api.uploadRoot, ['materials', 'x.pdf']), /Invalid upload path/);
});

for (const role of [null, 'STUDENT', 'PARENT', 'ACCOUNTANT']) {
  test('upload endpoint rejects unauthorized caller before reading body: ' + role, async () => {
    const api = load('src/app/api/upload/route.ts', { '@/lib/auth': { getSession: async () => role ? { role } : null }, '@/lib/private-uploads': uploads });
    const response = await api.POST({ formData() { throw new Error('Must not read body'); } });
    assert.equal(response.status, role ? 403 : 401);
  });
}

test('material access requires enrollment and cannot expose another batch via a shared course', async () => {
  const api = load('src/lib/material-access.ts', {
    './db': { db: { enrollment: { findMany: async q => { assert.equal(q.where.status, 'ACTIVE'); return [{ courseId: 'course-a', batchId: 'batch-a' }]; } } } },
    './campus-scope': scope, '@/server/actions/campus': { getActiveCampusId: async () => 'selected' },
  });
  const student = await api.materialAccessWhere({ role: 'STUDENT', studentId: 'student-a' });
  assert.equal(student.OR[1].batchId, null);
  assert.deepEqual(clean(student.OR[0].batchId.in), ['batch-a']);
  assert.deepEqual(clean(await api.materialAccessWhere({ role: 'STUDENT' })), { id: { in: [] } });
  assert.deepEqual(clean(await api.materialAccessWhere({ role: 'PARENT' })), { id: { in: [] } });
});

test('authorized upload writes private storage and owner metadata; spoofed files write nothing', async () => {
  const writes = [];
  const api = load('src/app/api/upload/route.ts', {
    '@/lib/auth': { getSession: async () => ({ role: 'TEACHER', id: 'teacher-a' }) },
    '@/lib/private-uploads': uploads,
    'fs/promises': { mkdir: async () => {}, writeFile: async (file, contents) => writes.push({ file, contents }) },
  });
  const request = (name, content) => ({ headers: { get: () => null }, formData: async () => ({ get: () => ({ name, size: content.length, arrayBuffer: async () => Buffer.from(content) }) }) });
  assert.equal((await api.POST(request('fake.pdf', '<html>bad</html>'))).status, 400);
  assert.equal(writes.length, 0);
  const response = await api.POST(request('notes.pdf', '%PDF-1.7 example'));
  assert.equal(response.status, 200);
  assert.equal(writes.length, 2);
  assert.equal(JSON.parse(writes[0].contents).userId, 'teacher-a');
  assert.equal(writes.every(entry => entry.file.startsWith(uploads.uploadRoot + path.sep)), true);
  assert.match((await response.json()).fileUrl, /^\/api\/uploads\/materials\/[a-f0-9-]+\.pdf$/);
});

test('production study-material upload uses persistent storage and a signed ownership token', async () => {
  const objects = [];
  const api = load('src/app/api/upload/route.ts', {
    '@/lib/auth': { getSession: async () => ({ role: 'TEACHER', id: 'teacher-a' }) },
    '@/lib/private-uploads': {
      ...uploads,
      hasPersistentMaterialStorage: () => true,
      uploadMaterialObject: async (name, bytes, mime) => objects.push({ name, bytes: bytes.toString(), mime }),
      issueMaterialUploadToken: (url, userId) => `signed:${userId}:${url}`,
    },
    'fs/promises': { mkdir: async () => { throw new Error('local storage must not be used'); }, writeFile: async () => { throw new Error('local storage must not be used'); } },
  });
  const content = '%PDF-1.7 persistent';
  const response = await api.POST({
    headers: { get: () => null },
    formData: async () => ({ get: () => ({ name: 'notes.pdf', size: content.length, arrayBuffer: async () => Buffer.from(content) }) }),
  });
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(objects.length, 1);
  assert.equal(objects[0].mime, 'application/pdf');
  assert.equal(json.uploadToken, `signed:teacher-a:${json.fileUrl}`);
});

test('material upload ownership tokens are bound to user and file and expire', () => {
  const fileUrl = '/api/uploads/materials/notes.pdf';
  const token = uploads.issueMaterialUploadToken(fileUrl, 'teacher-a');
  assert.equal(uploads.verifyMaterialUploadToken(token, fileUrl, 'teacher-a'), true);
  assert.equal(uploads.verifyMaterialUploadToken(token, fileUrl, 'teacher-b'), false);
  assert.equal(uploads.verifyMaterialUploadToken(token, '/api/uploads/materials/other.pdf', 'teacher-a'), false);
  assert.equal(uploads.verifyMaterialUploadToken(token + 'x', fileUrl, 'teacher-a'), false);
});

test('finance metrics use remaining plan balances and refund-aware collections for one campus', async () => {
  const db = {
    payment: { aggregate: async ({ where }) => { assert.equal(where.student.instituteId, 'own'); return { _sum: { amount: 100 }, _count: 1 }; } },
    refundAdjustment: { aggregate: async ({ where }) => { assert.equal(where.payment.student.instituteId, 'own'); return { _sum: { amount: 40 } }; } },
    feePlan: { aggregate: async ({ where }) => { assert.equal(where.student.instituteId, 'own'); return { _sum: { finalAmount: 200, balanceAmount: 140 } }; } },
  };
  const api = load('src/lib/collection-totals.ts', { './db': { db } });
  assert.deepEqual(clean(await api.financeMetrics('own')), { totalCollected: 60, thisMonthCollected: 60, totalPending: 140, totalFees: 200, paymentsCount: 1 });
  assert.equal(api.indiaDateRange(new Date('2026-09-30T19:00:00Z'), 'day').start.toISOString(), '2026-09-30T18:30:00.000Z');
  assert.equal(api.indiaDateRange(new Date('2026-01-15T00:00:00Z'), 'month', -1).end.toISOString(), '2025-12-31T18:29:59.999Z');
});

test('material download tracking cannot grant access to an unauthorized student', async () => {
  let writes = 0;
  const api = load('src/server/actions/materials.ts', {
    '@/lib/db': { db: { studyMaterial: { findFirst: async () => null, update: async () => writes++ }, studentStudyMaterial: { upsert: async () => writes++ } } },
    '@/lib/auth': { requireAuth: async () => ({ role: 'STUDENT', studentId: 'student-a' }) },
    './audit': { logAudit: async () => {} }, 'next/cache': { revalidatePath() {} },
    '@/lib/material-access': { materialAccessWhere: async () => ({ batchId: 'own' }) },
    '@/lib/campus-scope': scope, './campus': { getActiveCampusId: async () => 'own' }, '@/lib/private-uploads': uploads,
  });
  await assert.rejects(() => api.trackMaterialDownload('foreign-material'), /Material not found/);
  assert.equal(writes, 0);
});

test('downloads require access; private headers, legacy links, metadata and path checks', async () => {
  let session = null, allowed = false, reads = 0;
  const api = load('src/app/api/uploads/[...path]/route.ts', {
    '@/lib/auth': { getSession: async () => session },
    '@/lib/db': { db: { studyMaterial: { findFirst: async query => { assert.equal(query.where.AND.length, 2); return allowed ? { id: 'material-a' } : null; } } } },
    '@/lib/material-access': { materialAccessWhere: async () => ({ batchId: 'allowed-batch' }) },
    '@/lib/private-uploads': { ...uploads, existingUploadPath: async () => 'private.pdf', uploadOwner: async () => 'owner' },
    'fs/promises': { readFile: async () => { reads++; return Buffer.from('%PDF-1.7 test'); } },
  });
  const get = parts => api.GET({}, { params: { path: parts || ['materials', 'notes.pdf'] } });
  assert.equal((await get()).status, 401);
  session = { role: 'STUDENT', id: 'student-a' };
  assert.equal((await get()).status, 404);
  assert.equal(reads, 0);
  allowed = true;
  const response = await get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.match(response.headers.get('content-disposition'), /^attachment;/);
  assert.equal((await get(['materials', 'notes.pdf.json'])).status, 404);
  assert.equal((await get(['..', 'secret.pdf'])).status, 400);
  allowed = false;
  session = { role: 'TEACHER', id: 'owner' };
  assert.equal((await get()).status, 200);
  session = { role: 'TEACHER', id: 'other' };
  assert.equal((await get()).status, 404);
});

test('database role revocation overrides defaults; permission database failure fails closed', async () => {
  let rolePermissions = [], override = null, roleExists = true, fail = false;
  const user = { id: 'admin', name: 'Admin', role: 'ADMIN', status: 'ACTIVE', isArchived: false };
  const api = load('src/lib/auth.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'token' }) }) },
    jose: { jwtVerify: async () => ({ payload: { id: 'admin' } }) },
    '@/lib/db': { db: {
      user: { findUnique: async () => user },
      userPermission: { findMany: async () => { if (fail) throw new Error('Database unavailable'); return override ? [{ ...override, permission: { code: 'users.view' } }] : []; } },
      permission: { findMany: async () => require('./auth-mock.cjs').permissions.ALL_PERMISSION_CODES.map(code => ({ code })) },
      role: { findUnique: async () => roleExists ? { permissions: rolePermissions } : null },
    } },
    '@/lib/permissions': require('./auth-mock.cjs').permissions, react: { cache: fn => fn },
    'next/navigation': { redirect() { throw new Error('Login'); } },
  });
  await assert.rejects(() => api.requirePermission('users.view'), /FORBIDDEN/);
  rolePermissions = [{ permission: { code: 'users.view' } }];
  assert.equal((await api.requirePermission('users.view')).id, 'admin');
  override = { granted: false };
  await assert.rejects(() => api.requirePermission('users.view'), /FORBIDDEN/);
  override = null; roleExists = false;
  assert.equal((await api.requirePermission('users.view')).id, 'admin');
  fail = true;
  await assert.rejects(() => api.requirePermission('users.view'), /Database unavailable/);
});

test('direct grants work for custom staff roles; student grants never unlock staff actions', async () => {
  let role = 'CUSTOM_ACCOUNTS';
  let granted = true;
  const api = load('src/lib/auth.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'token' }) }) },
    jose: { jwtVerify: async () => ({ payload: { id: 'actor' } }) },
    '@/lib/db': { db: {
      user: { findUnique: async () => ({ id: 'actor', role, status: 'ACTIVE', isArchived: false }) },
      role: { findUnique: async () => ({ permissions: [] }) },
      userPermission: { findMany: async () => [{ granted, permission: { code: 'fees.create' } }] },
      permission: { findMany: async () => require('./auth-mock.cjs').permissions.ALL_PERMISSION_CODES.map(code => ({ code })) },
    } },
    '@/lib/permissions': require('./auth-mock.cjs').permissions,
    react: { cache: fn => fn }, 'next/navigation': { redirect() { throw new Error('Login'); } },
  });
  assert.equal((await api.requireStaffPermission('fees.create')).role, 'CUSTOM_ACCOUNTS');
  granted = false;
  await assert.rejects(() => api.requireStaffPermission('fees.create'), /FORBIDDEN/);
  granted = true; role = 'STUDENT';
  await assert.rejects(() => api.requireStaffPermission('fees.create'), /Staff access required/);
});

test('related data redaction removes revoked fees/results without changing permitted data or dates', () => {
  const api = load('src/lib/redact-related-data.ts');
  const date = new Date();
  const data = { date, payments: [{ amount: 100 }], marks: [{ score: 90 }], batch: { timetableSlots: [{ id: 'slot' }], studyMaterials: [{ id: 'material' }] }, feeAmount: 100, receiptNo: 'receipt', paymentStatus: 'PAID' };
  const result = api.redactRelatedData(data, ['timetable.view']);
  assert.equal(result.date, date);
  assert.equal(result.payments.length, 0);
  assert.equal(result.marks.length, 0);
  assert.equal(result.batch.studyMaterials.length, 0);
  assert.equal(result.batch.timetableSlots.length, 1);
  assert.equal(result.paymentStatus, 'RESTRICTED');
  assert.equal(data.payments.length, 1);
});

test('student self-enrollment never marks an unverified payment paid', async () => {
  let created;
  const student = { id: 'student-a', instituteId: 'own' };
  const api = load('src/server/actions/test-series.ts', {
    '@/lib/auth': { requireAuth: async () => ({ role: 'STUDENT', studentId: student.id }) },
    '@/lib/campus-scope': { authorizedCampusId: (_session, selectedCampusId) => selectedCampusId },
    '@/server/actions/campus': { getActiveCampusId: async () => 'own' },
    '@/lib/db': { db: {
      testSeries: { findUnique: async () => ({ id: 'series-a', instituteId: 'own', status: 'ACTIVE', fee: 500 }) },
      testSeriesRegistration: { findFirst: async () => null, count: async () => 0, create: async ({ data }) => { created = data; return data; } },
    } },
    '@/server/actions/portal': { resolveCurrentStudent: async () => ({ student }) },
    './audit': { logAudit: async () => {} },
    'next/cache': { revalidatePath() {} },
  });
  assert.equal((await api.enrollStudentSelf('series-a', 'UPI')).success, true);
  assert.equal(created.paymentStatus, 'PENDING');
  assert.equal(created.paidAt, null);
  assert.equal(created.feeAmount, 500);
});

test('revoked material permissions block upload and download before storage access', async () => {
  const auth = { getSession: async () => ({ role: 'ADMIN' }), getEffectivePermissions: async () => [] };
  const post = load('src/app/api/upload/route.ts', { '@/lib/auth': auth, '@/lib/private-uploads': uploads });
  assert.equal((await post.POST({})).status, 403);
  const get = load('src/app/api/uploads/[...path]/route.ts', {
    '@/lib/auth': auth, '@/lib/private-uploads': uploads,
    '@/lib/db': { db: {} }, '@/lib/material-access': {},
  });
  assert.equal((await get.GET({}, { params: { path: ['materials', 'x.pdf'] } })).status, 403);
});

test('navigation uses effective permissions for custom roles', () => {
  const api = load('src/lib/navigation-permissions.ts');
  assert.equal(api.canNavigate('/finance/payments', []), false);
  assert.equal(api.canNavigate('/finance/payments', ['fees.view']), true);
  assert.equal(api.canNavigate('/materials', ['materials.manage']), false);
  assert.equal(api.canNavigate('/portal/fees', []), false);
  assert.equal(api.canNavigate('/profile', []), true);
});

function batchCreationFixture({ campus = 'campus-two', duplicate = false, failCreate = false, teacherCount = 0 } = {}) {
  const writes = [];
  const pending = [];
  const tx = {
    $queryRaw: async () => [{ id: campus }],
    teacher: { count: async () => teacherCount },
    course: {
      findFirst: async () => null,
      create: async ({ data }) => { pending.push({ type: 'course', ...data }); return { id: 'course', ...data }; },
    },
    batch: {
      findUnique: async () => duplicate ? { id: 'existing' } : null,
      create: async ({ data }) => {
        if (failCreate) throw new Error('Teacher link failed');
        pending.push({ type: 'batch', ...data }); return { id: 'batch', ...data };
      },
    },
  };
  const api = load('src/server/actions/academics.ts', {
    '@/lib/db': { db: { $transaction: async fn => { const result = await fn(tx); writes.push(...pending); return result; } } },
    '@/lib/auth': { getSession: async () => ({ id: 'actor', role: 'ADMIN', instituteId: campus }) },
    '@/lib/campus-scope': scope,
    './campus': { getActiveCampusId: async () => 'forged-campus' },
    './audit': { logAudit: async () => {} },
    'next/cache': { revalidatePath() {} },
  });
  return { api, writes };
}
const validBatch = { name: ' Class 11 ', code: ' bat-11 ', startDate: '2026-09-01', endDate: '2027-09-01', capacity: 40 };
test('batch creation uses campus-specific default course and saves teacher links atomically', async () => {
  const f = batchCreationFixture({ teacherCount: 1 });
  const result = await f.api.createBatch({ ...validBatch, teacherIds: ['teacher', 'teacher'] });
  assert.equal(result.success, true);
  assert.equal(f.writes[0].code, 'GEN-PROG-campus-two');
  assert.equal(f.writes[1].instituteId, 'campus-two');
  assert.equal(f.writes[1].code, 'BAT-11');
  assert.equal(f.writes[1].name, 'Class 11');
  assert.deepEqual(clean(f.writes[1].teachers.create), [{ teacherId: 'teacher' }]);
});
test('duplicate batch code returns an actionable error without creating records', async () => {
  const f = batchCreationFixture({ duplicate: true });
  const result = await f.api.createBatch(validBatch);
  assert.equal(result.success, false);
  assert.match(result.error, /code already exists/);
  assert.equal(f.writes.length, 0);
});
test('batch creation rejects invalid dates, capacity, foreign teachers and courses', async () => {
  for (const patch of [{ endDate: '2020-01-01' }, { startDate: '' }, { capacity: 0 }, { capacity: 1.5 }, { capacity: 201 }, { teacherIds: ['foreign'] }, { courseId: 'foreign' }]) {
    const f = batchCreationFixture();
    assert.equal((await f.api.createBatch({ ...validBatch, ...patch })).success, false);
    assert.equal(f.writes.length, 0);
  }
});
test('failed batch insert rolls back default course creation', async () => {
  const f = batchCreationFixture({ failCreate: true });
  assert.equal((await f.api.createBatch(validBatch)).success, false);
  assert.equal(f.writes.length, 0);
});

function batchUpdateFixture({ failUpdate = false } = {}) {
  const committed = [];
  const existing = {
    id: 'batch-a', instituteId: 'campus-a', courseId: 'course-a',
    name: 'Old Batch', code: 'OLD', room: 'Old Hall', status: 'ACTIVE',
  };
  const db = {
    batch: { findUnique: async () => existing },
    teacher: { findMany: async ({ where }) => where.id.in.map((id) => ({ id })) },
    $transaction: async (callback) => {
      const pending = [];
      const result = await callback({
        teacherBatch: {
          deleteMany: async (args) => pending.push(['delete-teachers', args]),
          createMany: async (args) => pending.push(['create-teachers', args]),
        },
        batch: {
          update: async (args) => {
            if (failUpdate) throw new Error('batch write failed');
            pending.push(['update-batch', args]);
            return { ...existing, ...args.data, teachers: [], _count: {} };
          },
        },
      });
      committed.push(...pending);
      return result;
    },
  };
  const api = load('src/server/actions/academics.ts', {
    '@/lib/db': { db },
    '@/lib/auth': {
      requireStaffPermission: async () => ({ id: 'actor', role: 'SUPER_ADMIN', instituteId: null }),
      getEffectivePermissions: async () => [],
    },
    '@/lib/campus-scope': scope,
    './campus': { getActiveCampusId: async () => 'campus-a' },
    './audit': { logAudit: async () => {} },
    '@/lib/redact-related-data': { redactRelatedData: (value) => value },
    'next/cache': { revalidatePath() {} },
  });
  return { api, committed };
}

test('batch edit persists room and details together with faculty assignments', async () => {
  const f = batchUpdateFixture();
  const result = await f.api.updateBatch('batch-a', {
    name: 'Updated Batch', code: 'new-code', room: 'Lecture Hall 7',
    startDate: '2026-09-01', endDate: '2027-08-31', capacity: 55,
    status: 'UPCOMING', teacherIds: ['teacher-a'],
  });
  assert.equal(result.success, true);
  assert.equal(result.batch.room, 'Lecture Hall 7');
  const update = f.committed.find(([name]) => name === 'update-batch')[1];
  assert.equal(update.data.name, 'Updated Batch');
  assert.equal(update.data.code, 'NEW-CODE');
  assert.equal(update.data.capacity, 55);
  assert.deepEqual(clean(f.committed.map(([name]) => name)), [
    'delete-teachers', 'create-teachers', 'update-batch',
  ]);
});

test('failed batch detail update rolls back faculty assignment changes', async () => {
  const f = batchUpdateFixture({ failUpdate: true });
  await assert.rejects(
    f.api.updateBatch('batch-a', { room: 'Lecture Hall 9', teacherIds: ['teacher-a'] }),
    /batch write failed/
  );
  assert.equal(f.committed.length, 0);
});
