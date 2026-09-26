const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function fixture({ role = 'SUPER_ADMIN', assignedCampus = 'first' } = {}) {
  const campuses = [
    { id: 'first', instituteId: 'futurex', name: 'Main Campus', code: 'MAIN' },
    { id: 'second', instituteId: 'futurex', name: 'Second Campus', code: 'SECOND' },
  ];
  const writes = [];
  const db = {
    institute: {
      findUnique: async ({ where }) => campuses.find(campus => campus.id === where.id || campus.code === where.code) || null,
      update: async ({ where, data }) => {
        writes.push(where.id);
        const campus = campuses.find(item => item.id === where.id);
        Object.assign(campus, data);
        return campus;
      },
    },
  };
  const mocks = {
    '@/lib/auth': {
      requireStaffPermission: async () => ({ role, instituteId: assignedCampus }),
      getSession: async () => ({ role, instituteId: assignedCampus }),
    },
    '@/lib/db': { db },
    'next/headers': { cookies: async () => ({ get: () => null }) },
    'next/cache': { revalidatePath() {} },
    react: { cache: callback => callback },
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/server/actions/campus.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, console: { error() {} }, require: id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    throw new Error('Missing mock: ' + id);
  } });
  return { api: exports, campuses, writes };
}

test('campus editing changes the selected filter record, not the Futurex institute profile', async () => {
  const f = fixture();
  const result = await f.api.updateCampus('second', {
    name: ' Parraypora Campus ', code: ' fl-parraypora ', city: 'Srinagar',
  });
  assert.equal(result.success, true);
  assert.deepEqual(f.writes, ['second']);
  assert.equal(f.campuses[0].name, 'Main Campus');
  assert.equal(f.campuses[1].name, 'Parraypora Campus');
  assert.equal(f.campuses[1].code, 'FL-PARRAYPORA');
});

test('assigned staff can edit only their campus filter', async () => {
  const f = fixture({ role: 'ADMIN', assignedCampus: 'first' });
  const result = await f.api.updateCampus('second', { name: 'Wrong', code: 'WRONG' });
  assert.equal(result.success, false);
  assert.match(result.error, /assigned campus/);
  assert.deepEqual(f.writes, []);
});

test('campus names and codes are required and codes stay unique', async () => {
  const f = fixture();
  assert.equal((await f.api.updateCampus('second', { name: '', code: 'X' })).success, false);
  assert.equal((await f.api.updateCampus('second', { name: 'Second', code: 'MAIN' })).success, false);
  assert.deepEqual(f.writes, []);
});
