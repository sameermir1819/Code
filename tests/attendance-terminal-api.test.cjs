const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks, context = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, Error, console: { error() {} }, ...context,
    require(id) { if (id in mocks) return mocks[id]; throw new Error('Missing mock: ' + id); },
  });
  return exports;
}

function routeFixture({ scan, feed } = {}) {
  const calls = [];
  const api = load('src/app/api/attendance/terminal/route.ts', {
    'next/server': require('next/server'),
    '@/server/actions/attendance': {
      recordQrAttendanceSafe: async (...args) => { calls.push(args); return scan ? scan(...args) : {
        success: true, student: { name: 'Student A' }, record: { id: 'attendance-a', checkInScanId: 'private-id' },
        liveEntry: { id: 'attendance-a', gateStatus: 'INSIDE' },
      }; },
      getTodayAttendanceLiveFeed: async campusId => { calls.push(campusId); return feed ? feed(campusId) : []; },
    },
  });
  return { api, calls };
}

function scanRequest(body = {}, headers = {}) {
  return new Request('https://erp.example/api/attendance/terminal', { method: 'POST',
    headers: { origin: 'https://erp.example', 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ code: 'STU-A', requestId: 'same-retry-id', campusId: 'campus-a', ...body }),
  });
}

test('JSON save forwards the selected campus and stable retry ID with no-cache confirmation', async () => {
  const f = routeFixture();
  const response = await f.api.POST(scanRequest());
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.deepEqual(f.calls, [['STU-A', 'same-retry-id', 'campus-a']]);
  const result = await response.json();
  assert.equal(result.success, true);
  assert.equal(result.liveEntry.gateStatus, 'INSIDE');
  assert.equal('record' in result, false, 'internal scan IDs are omitted');
});

test('save API rejects cross-origin and malformed requests before calling the action', async () => {
  const f = routeFixture();
  for (const request of [
    scanRequest({}, { origin: 'https://evil.example' }),
    scanRequest({}, { origin: '' }),
    scanRequest({}, { 'sec-fetch-site': 'cross-site' }),
    scanRequest({}, { 'content-type': 'text/plain' }),
    scanRequest({}, { 'content-length': '5000' }),
    scanRequest({ campusId: '' }), scanRequest({ requestId: '' }), scanRequest({ code: null }),
    scanRequest({ code: 'x'.repeat(5000) }),
  ]) assert.ok((await f.api.POST(request)).status >= 400);
  assert.equal(f.calls.length, 0);
});

test('save API preserves operational errors and denies expired or forbidden accounts', async () => {
  for (const [scan, status, text] of [
    [async () => ({ success: false, error: 'Student account is inactive.' }), 400, /inactive/],
    [async () => { throw new Error('NEXT_REDIRECT'); }, 401, /Sign in/],
    [async () => { throw new Error('FORBIDDEN: permission revoked'); }, 403, /permission/],
    [async () => { throw new Error('secret database connection detail'); }, 503, /retry/],
  ]) {
    const f = routeFixture({ scan });
    const response = await f.api.POST(scanRequest());
    assert.equal(response.status, status);
    const result = await response.json();
    assert.equal(result.success, false);
    assert.match(result.error, text);
    assert.doesNotMatch(result.error, /secret/);
  }
});

test('feed API requires an explicit campus and reuses the permission-protected feed', async () => {
  const f = routeFixture();
  assert.equal((await f.api.GET(new Request('https://erp.example/api/attendance/terminal'))).status, 400);
  assert.equal(f.calls.length, 0);
  const response = await f.api.GET(new Request('https://erp.example/api/attendance/terminal?campusId=campus-b'));
  assert.deepEqual(f.calls, ['campus-b']);
  assert.deepEqual(await response.json(), { entries: [] });
  assert.match(response.headers.get('cache-control'), /no-store/);
  const denied = routeFixture({ feed: async () => { throw new Error('FORBIDDEN'); } });
  assert.equal((await denied.api.GET(new Request('https://erp.example/api/attendance/terminal?campusId=campus-b'))).status, 403);
});

test('feed and save JSON requests run independently instead of queueing behind each other', async () => {
  let completeFeed;
  const calls = [];
  const api = load('src/lib/attendance-terminal-client.ts', {}, { fetch: async (url, options) => {
    calls.push({ url, options });
    if (options.method !== 'POST') return new Promise(resolve => { completeFeed = () => resolve({ ok: true, json: async () => ({ entries: [] }) }); });
    return { ok: true, json: async () => ({ success: true, student: { name: 'Student A' }, liveEntry: { id: 'attendance-a' } }) };
  } });
  const feed = api.fetchAttendanceFeed('campus-b');
  const result = await api.saveAttendanceScan('STU-A', 'stable-id', 'campus-b');
  assert.equal(result.success, true, 'save finishes even while feed is unresolved');
  assert.equal(calls[1].url, '/api/attendance/terminal');
  assert.equal(calls[1].options.credentials, 'same-origin');
  assert.equal(calls[1].options.cache, 'no-store');
  assert.deepEqual(JSON.parse(calls[1].options.body), { code: 'STU-A', requestId: 'stable-id', campusId: 'campus-b' });
  completeFeed();
  assert.equal((await feed).length, 0);
});

test('network and malformed confirmations never produce a fake success', async () => {
  for (const response of [
    { ok: false, json: async () => ({ error: 'Sign in again.' }) },
    { ok: true, json: async () => { throw new Error('Invalid JSON'); } },
    { ok: true, json: async () => ({ success: true }) },
  ]) {
    const api = load('src/lib/attendance-terminal-client.ts', {}, { fetch: async () => response });
    await assert.rejects(api.saveAttendanceScan('STU-A', 'stable-id', 'campus-a'));
  }
});
