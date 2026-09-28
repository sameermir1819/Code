const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const QRCode = require('qrcode');
const jsQR = require('jsqr');

function load(file, context = {}, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, Map, crypto: require('node:crypto').webcrypto, ...context, require(id) {
    if (id in mocks) return mocks[id];
    throw new Error('Missing dependency: ' + id);
  } });
  return exports;
}
const attendance = load('src/lib/attendance-scanner.ts');
const camera = load('src/lib/camera-scanner.ts', {}, { './attendance-scanner': attendance });

test('phone decoder reads QR images used on printed and legacy student cards', () => {
  for (const payload of ['STU-MAIN-2026-0001', '{"studentId":"STU-MAIN-2026-0001"}']) {
    const modules = QRCode.create(payload).modules;
    const size = (modules.size + 8) * 6;
    const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let row = 0; row < modules.size; row++) for (let col = 0; col < modules.size; col++) {
      if (!modules.get(row, col)) continue;
      for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
        const offset = (((row + 4) * 6 + y) * size + (col + 4) * 6 + x) * 4;
        pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
      }
    }
    const result = jsQR(pixels, size, size, { inversionAttempts: 'dontInvert' });
    assert.ok(result);
    assert.equal(attendance.parseStudentCard(result.data), 'STU-MAIN-2026-0001');
  }
});

test('a card held at the camera never changes check-in into check-out', () => {
  const accept = camera.createCameraScanGate();
  assert.equal(accept('STU-A', 0), true);
  for (let time = 200; time <= 90000; time += 200) assert.equal(accept('STU-A', time), false);
  assert.equal(accept('STU-A', 92000), true, 'card must leave the frame before rescanning');
});

test('next card can scan after short pause and repeats obey the 60-second cooldown', () => {
  const accept = camera.createCameraScanGate();
  assert.equal(accept('STU-A', 0), true);
  assert.equal(accept('STU-B', 400), false);
  assert.equal(accept('STU-B', 1400), true, 'next card held during pause must not become stuck');
  assert.equal(accept('STU-A', 10000), false);
  assert.equal(accept('STU-A', 60000), true);
});

function sessionFixture({ acquire, playbackError, decode } = {}) {
  let stops = 0;
  let clock = 0;
  let timerId = 0;
  const timers = new Map();
  const constraints = [];
  const decoded = [];
  const errors = [];
  const track = { stop() { stops++; } };
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  const video = {
    srcObject: null, readyState: 2, videoWidth: 1280, videoHeight: 720,
    play: async () => { if (playbackError) throw playbackError; }, pause() {},
  };
  const canvas = { width: 0, height: 0, getContext: () => ({
    drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(), width: canvas.width, height: canvas.height }),
  }) };
  class Clock extends Date { static now() { return clock; } }
  const api = load('src/lib/camera-scanner.ts', {
    Date: Clock,
    window: { setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; }, clearTimeout(id) { timers.delete(id); } },
    document: { createElement: () => canvas },
    navigator: { mediaDevices: { getUserMedia: async options => { constraints.push(options); return acquire ? acquire() : stream; } } },
  }, { './attendance-scanner': attendance });
  const session = api.createCameraSession(video, decode ?? (() => ({ data: 'STU-A' })), code => decoded.push(code), error => errors.push(error));
  return {
    session, stream, video, canvas, decoded, errors, constraints, stops: () => stops, timers,
    frame(time) { clock = time; const [id, scheduled] = timers.entries().next().value; timers.delete(id); scheduled.fn(); },
  };
}

test('camera uses rear video only, bounds image size, and releases tracks and timers on stop', async () => {
  const f = sessionFixture();
  assert.equal(await f.session.start(), true);
  assert.equal(f.constraints[0].audio, false);
  assert.equal(f.constraints[0].video.facingMode.ideal, 'environment');
  assert.equal(f.canvas.width, 640);
  assert.equal(f.canvas.height, 360);
  assert.deepEqual(f.decoded, ['STU-A']);
  f.frame(200);
  assert.deepEqual(f.decoded, ['STU-A']);
  f.session.stop();
  assert.equal(f.stops(), 1);
  assert.equal(f.video.srcObject, null);
  assert.equal(f.timers.size, 0);
});

test('cancelled permission request releases the camera even when access arrives late', async () => {
  let resolve;
  const promise = new Promise(complete => { resolve = complete; });
  const f = sessionFixture({ acquire: () => promise });
  const start = f.session.start();
  f.session.stop();
  resolve(f.stream);
  assert.equal(await start, false);
  assert.equal(f.stops(), 1);
  assert.equal(f.video.srcObject, null);
  assert.equal(f.decoded.length, 0);
});

test('playback and decoding failures release camera resources instead of reporting success', async () => {
  const error = new Error('Playback blocked');
  const f = sessionFixture({ playbackError: error });
  await assert.rejects(f.session.start(), /Playback blocked/);
  assert.equal(f.stops(), 1);
  assert.equal(f.timers.size, 0);
  const broken = sessionFixture({ decode: () => { throw error; } });
  assert.equal(await broken.session.start(), false);
  assert.equal(broken.stops(), 1);
  assert.deepEqual(broken.errors, [error]);
  assert.equal(broken.timers.size, 0);
});

test('camera permission and unavailable-device errors have actionable messages', () => {
  assert.match(camera.cameraErrorMessage({ name: 'NotAllowedError' }), /Allow camera access/);
  assert.match(camera.cameraErrorMessage({ name: 'NotFoundError' }), /No usable camera/);
  assert.match(camera.cameraErrorMessage({ name: 'NotReadableError' }), /Close other apps/);
});

function terminalFixture(results) {
  const cells = [];
  let cursor = 0;
  const submissions = [];
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in cells)) cells[i] = typeof initial === 'function' ? initial() : initial;
      return [cells[i], next => { cells[i] = typeof next === 'function' ? next(cells[i]) : next; }];
    },
    useRef(initial) { const i = cursor++; return cells[i] ??= { current: initial }; },
    useCallback: fn => fn, useEffect() {},
  };
  const components = new Proxy({}, { get: (_, name) => String(name) });
  const api = load('src/components/attendance/qr-device-terminal.tsx', { navigator: {} }, {
    react: hooks,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': components,
    './camera-qr-scanner': { CameraQrScanner: 'CameraQrScanner' },
    '@/components/ui/card': components, '@/components/ui/button': components,
    '@/components/ui/badge': components, '@/components/ui/input': components,
    '@/lib/attendance-scanner': attendance, '@/lib/audio-chime': { playCheckInChime() {} },
    '@/server/actions/attendance': {
      getTodayAttendanceLiveFeed: async () => [],
      recordQrAttendanceSafe: async (...args) => {
        submissions.push(args);
        return results.shift() ?? { success: true, isAlreadyMarked: false, student: { name: 'Aisha' }, message: 'Checked in.' };
      },
    },
  });
  function flatten(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(flatten);
    return [node, ...flatten(node.props?.children)];
  }
  function render() { cursor = 0; return flatten(api.QrDeviceTerminal({ campusId: 'campus-b', onPendingChange() {} })); }
  return { render, submissions, scan: payload => render().find(node => node.type === 'CameraQrScanner').props.onScan(payload) };
}

test('camera scans use the selected campus and preserve request IDs on a failed-scan retry', async () => {
  const f = terminalFixture([{ success: false, error: 'Connection unavailable. Try again.' }]);
  f.scan('STU-A');
  await new Promise(setImmediate);
  assert.equal(f.submissions[0][0], 'STU-A');
  assert.equal(f.submissions[0][2], 'campus-b');
  assert.match(f.submissions[0][1], /^[a-f0-9]{32}$/);
  const retry = f.render().find(node => node.type === 'Button' && Array.isArray(node.props.children) && node.props.children[0] === 'Retry ');
  assert.ok(retry);
  retry.props.onClick();
  await new Promise(setImmediate);
  assert.equal(f.submissions.length, 2);
  assert.deepEqual(f.submissions[1], f.submissions[0]);
});

test('camera ignores non-student QR contents before any attendance request', async () => {
  const f = terminalFixture([]);
  f.scan('https://example.com');
  await new Promise(setImmediate);
  assert.equal(f.submissions.length, 0);
});
