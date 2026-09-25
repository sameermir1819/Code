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
    for (const { model, query } of calls) assert.equal(model === 'payment' ? query.where.student.instituteId : query.where.instituteId, 'own');
    assert.equal(calls.some(c => c.model === 'payment'), ['ADMIN', 'ACCOUNTANT'].includes(role));
    assert.equal(calls.some(c => c.model === 'teacher'), role === 'ADMIN');
  });
}

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
    '@/lib/db': { db: {
      testSeries: { findUnique: async () => ({ id: 'series-a', instituteId: 'own', status: 'ACTIVE', fee: 500 }) },
      testSeriesRegistration: { findFirst: async () => null, count: async () => 0, create: async ({ data }) => { created = data; return data; } },
    } },
    '@/server/actions/portal': { resolveCurrentStudent: async () => ({ student }) },
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
