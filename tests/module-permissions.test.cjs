const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const map = require('../docs/action-permission-map.json');

function fixture() {
  const cache = new Map();
  let blocked, denied = 0, databaseCalls = 0;
  const actor = { id: 'actor', role: 'ADMIN', instituteId: 'campus', name: 'Actor' };
  const guard = async code => {
    if (code === blocked) { denied++; throw new Error('FORBIDDEN: revoked ' + code); }
    return actor;
  };
  const db = new Proxy({}, { get() { return new Proxy(() => {}, { get() { return () => { databaseCalls++; throw new Error('Unexpected database access'); }; }, apply() { databaseCalls++; throw new Error('Unexpected database access'); } }); } });
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInNewContext(source, {
      exports, URL, Date, Buffer, TextEncoder, Intl, console: { error() {} }, process: { cwd: () => root, env: { NODE_ENV: 'test' } },
      require(id) {
        if (id === '@/lib/auth') return { requirePermission: guard, requireStaffPermission: guard, requireAuth: async () => actor, getSession: async () => actor, getEffectivePermissions: async () => [] };
        if (id === 'react') return { cache: fn => fn };
        if (id === 'next/cache') return { revalidatePath() {} };
        if (id === 'next/headers') return { cookies: async () => ({ get: () => null }) };
        if (id.startsWith('@/') || id.startsWith('.')) {
          let target = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(file), id);
          if (target === path.join(root, 'src/lib/db')) return { db };
          return load(target + '.ts');
        }
        return require(id);
      },
    }, { filename: file });
    return exports;
  }
  return { load, block(code) { blocked = code; denied = 0; databaseCalls = 0; }, counts: () => ({ denied, databaseCalls }) };
}

for (const [module, actions] of Object.entries(map)) {
  test(module + ': every protected action blocks revoked permission before data access', async () => {
    const f = fixture();
    const api = f.load(path.join(root, 'src/server/actions', module + '.ts'));
    for (const [name, code] of Object.entries(actions)) {
      f.block(code);
      try { await api[name]({}, {}, {}); } catch (error) { assert.match(error.message, /FORBIDDEN/, module + '.' + name); }
      assert.equal(f.counts().denied, 1, module + '.' + name + ' must check ' + code);
      assert.equal(f.counts().databaseCalls, 0, module + '.' + name + ' must not access data');
    }
  });
}

test('permission catalog synchronization never restores a removed existing grant', async () => {
  const permissions = require('./auth-mock.cjs').permissions;
  const catalog = new Map(permissions.ALL_PERMISSION_CODES.map(code => [code, { id: code, code }]));
  const grants = [];
  const existingGrants = new Set();
  let advisoryLocks = 0;
  const tx = {
    $executeRaw: async () => { advisoryLocks++; },
    permission: { findMany: async () => [...catalog.values()], upsert: async ({ create }) => { if (!catalog.has(create.code)) catalog.set(create.code, { ...create, id: create.code }); } },
    role: { findUnique: async ({ where }) => ({ id: where.name, name: where.name }) },
    rolePermission: {
      upsert: async ({ where, create }) => {
        const key = `${where.roleId_permissionId.roleId}:${where.roleId_permissionId.permissionId}`;
        if (!existingGrants.has(key)) {
          existingGrants.add(key);
          grants.push(create);
        }
      },
    },
  };
  const db = { $transaction: async fn => fn(tx) };
  const environment = { DATABASE_URL: 'postgresql://localhost/test' };
  function load(file, mocks) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { exports, process: { env: environment }, require: id => { if (!(id in mocks)) throw new Error(id); return mocks[id]; } });
    return exports;
  }
  const definitions = load('src/lib/permission-definitions.ts', { './permissions': permissions });
  const api = load('src/lib/permission-catalog.ts', { './db': { db }, './permissions': permissions, './permission-definitions': definitions });
  await api.syncPermissionCatalog();
  assert.equal(advisoryLocks, 1, 'PostgreSQL sync must acquire the advisory lock');
  environment.DATABASE_URL = 'file:local.sqlite';
  await api.syncPermissionCatalog();
  assert.equal(advisoryLocks, 1, 'SQLite sync must not issue the PostgreSQL-only advisory lock');
  environment.DATABASE_URL = 'postgresql://localhost/test';
  assert.equal(grants.length, 0, 'existing catalog grants must be left untouched');
  catalog.delete('materials.manage');
  await api.syncPermissionCatalog();
  assert(grants.some(g => g.roleId === 'ADMIN' && g.permissionId === 'materials.manage'));
  assert.equal(grants.some(g => g.permissionId === 'fees.view'), false);
  const count = grants.length;
  await api.syncPermissionCatalog();
  assert.equal(grants.length, count, 'repeated sync must not regrant any permissions');
});
