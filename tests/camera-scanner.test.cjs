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

function sessionFixture({ acquire, playbackError, decode, focusModes, focusError, zoom, devices, enumerate, currentDeviceId = 'rear-current', drawImage, getImageData } = {}) {
  let stops = 0;
  let clock = 0;
  let timerId = 0;
  const timers = new Map();
  const constraints = [];
  const decoded = [];
  const errors = [];
  const draws = [];
  const focusConstraints = [];
  const track = {
    stop() { stops++; },
    getCapabilities: () => ({ focusMode: focusModes, zoom }),
    getSettings: () => ({ deviceId: currentDeviceId }),
    getConstraints: () => ({ facingMode: 'environment' }),
    async applyConstraints(options) { focusConstraints.push(options); if (focusError) throw focusError; },
  };
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  const video = {
    srcObject: null, readyState: 2, videoWidth: 1280, videoHeight: 720,
    play: async () => { if (playbackError) throw playbackError; }, pause() {},
  };
  const canvas = { width: 0, height: 0, getContext: () => ({
    drawImage(...args) { draws.push(args); drawImage?.(...args); },
    getImageData: () => getImageData ? getImageData(canvas.width, canvas.height) : ({ data: new Uint8ClampedArray(), width: canvas.width, height: canvas.height }),
  }) };
  class Clock extends Date { static now() { return clock; } }
  const api = load('src/lib/camera-scanner.ts', {
    Date: Clock,
    window: { setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; }, clearTimeout(id) { timers.delete(id); } },
    document: { createElement: () => canvas },
    navigator: { mediaDevices: {
      getUserMedia: async options => { constraints.push(options); return acquire ? acquire(options) : stream; },
      enumerateDevices: enumerate ?? (devices ? async () => devices : undefined),
    } },
  }, { './attendance-scanner': attendance });
  const session = api.createCameraSession(video, decode ?? (() => ({ data: 'STU-A' })), code => decoded.push(code), error => errors.push(error));
  return {
    session, stream, video, canvas, decoded, errors, constraints, draws, focusConstraints, stops: () => stops, timers,
    frame(time) { clock = time; const [id, scheduled] = timers.entries().next().value; timers.delete(id); scheduled.fn(); },
  };
}

test('camera uses rear video only, bounds image size, and releases tracks and timers on stop', async () => {
  const f = sessionFixture();
  assert.equal(await f.session.start(), true);
  assert.equal(f.constraints[0].audio, false);
  assert.equal(f.constraints[0].video.facingMode.ideal, 'environment');
  assert.equal(f.canvas.width, 512);
  assert.equal(f.canvas.height, 512);
  assert.deepEqual(f.draws[0].slice(1), [352, 72, 576, 576, 0, 0, 512, 512]);
  assert.equal([...f.timers.values()][0].delay, 100, 'no fixed 200ms wait after decoding');
  assert.deepEqual(f.decoded, ['STU-A']);
  f.frame(200);
  assert.deepEqual(f.decoded, ['STU-A']);
  f.session.stop();
  assert.equal(f.stops(), 1);
  assert.equal(f.video.srcObject, null);
  assert.equal(f.timers.size, 0);
});

test('whole-frame fallback still detects cards outside the faster central scan box', async () => {
  const sizes = [];
  const f = sessionFixture({ decode: (_pixels, width, height) => {
    sizes.push([width, height]);
    return width === 640 && height === 360 ? { data: 'STU-OFF-CENTRE' } : null;
  } });
  await f.session.start();
  f.frame(100);
  f.frame(200);
  assert.deepEqual(sizes, [[512, 512], [512, 512], [640, 360]]);
  assert.deepEqual(f.draws[2].slice(1), [0, 0, 1280, 720, 0, 0, 640, 360]);
  assert.deepEqual(f.decoded, ['STU-OFF-CENTRE']);
  f.session.stop();
});

test('small legacy QR is decoded from the high-detail central crop', async () => {
  const payload = '{"studentId":"STU-MAIN-2026-0001"}';
  const modules = QRCode.create(payload).modules;
  const native = new Uint8ClampedArray(1280 * 720 * 4).fill(255);
  const originX = Math.floor((1280 - modules.size * 3) / 2);
  const originY = Math.floor((720 - modules.size * 3) / 2);
  for (let row = 0; row < modules.size; row++) for (let col = 0; col < modules.size; col++) {
    if (!modules.get(row, col)) continue;
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
      const offset = ((originY + row * 3 + y) * 1280 + originX + col * 3 + x) * 4;
      native[offset] = native[offset + 1] = native[offset + 2] = 0;
    }
  }
  let region;
  const f = sessionFixture({ decode: jsQR,
    drawImage: (_video, ...args) => { region = args; },
    getImageData(width, height) {
      const [sx, sy, sw, sh] = region;
      const data = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const source = (Math.floor(sy + y * sh / height) * 1280 + Math.floor(sx + x * sw / width)) * 4;
        data.set(native.subarray(source, source + 4), (y * width + x) * 4);
      }
      return { data, width, height };
    },
  });
  assert.equal(await f.session.start(), true);
  assert.deepEqual(f.decoded, [payload], 'small QR should be read on the very first crop');
  f.session.stop();
});

test('continuous autofocus is optional, preserves constraints, and does not block startup', async () => {
  for (const focusError of [undefined, new Error('Unsupported focus')]) {
    const f = sessionFixture({ focusModes: ['manual', 'continuous'], focusError });
    assert.equal(await f.session.start(), true);
    assert.equal(f.focusConstraints[0].facingMode, 'environment');
    assert.equal(f.focusConstraints[0].advanced[0].focusMode, 'continuous');
    assert.equal(f.errors.length, 0);
    f.session.stop();
  }
  const f = sessionFixture({ focusModes: ['manual'] });
  assert.equal(await f.session.start(), true);
  assert.equal(f.focusConstraints.length, 0);
  f.session.stop();
});

const lens = (deviceId, label, kind = 'videoinput') => ({ deviceId, label, kind });

test('primary rear selection excludes ultra-wide, telephoto, macro and front lenses', () => {
  const devices = [lens('ultra', 'Back Ultra Wide Camera'), lens('front', 'Front Camera'),
    lens('tele', 'Back Telephoto Camera'), lens('macro', 'Rear Macro Camera'),
    lens('main', 'Back Camera'), lens('audio', 'Rear main', 'audioinput')];
  assert.equal(camera.selectPrimaryRearCamera(devices, 'ultra'), 'main');
  assert.equal(camera.selectPrimaryRearCamera([lens('wide', 'Back Wide Angle Camera'), lens('virtual', 'Back Triple Camera')]), 'wide');
  assert.equal(camera.selectPrimaryRearCamera([lens('unknown', ''), lens('front', 'Front Camera')]), undefined);
  assert.equal(camera.selectPrimaryRearCamera([lens('first', 'camera rear'), lens('current', 'camera rear')], 'current'), 'current');
  assert.equal(camera.selectPrimaryRearCamera([lens('other', 'Rear Camera'), lens('main', 'Rear Main 1x Camera')]), 'main');
});

test('supported zoom is set to 1x alongside continuous autofocus', async () => {
  const f = sessionFixture({ focusModes: ['continuous'], zoom: { min: 1, max: 8 } });
  assert.equal(await f.session.start(), true);
  assert.deepEqual(JSON.parse(JSON.stringify(f.focusConstraints[0].advanced)), [{ zoom: 1 }, { focusMode: 'continuous' }]);
  f.session.stop();
  const incompatible = sessionFixture({ zoom: { min: 2, max: 8 } });
  assert.equal(await incompatible.session.start(), true);
  assert.equal(incompatible.focusConstraints.length, 0, 'unsupported 1x must not prevent scanning');
  incompatible.session.stop();
});

test('startup switches to the identified primary lens and releases the default rear stream', async () => {
  let primaryStops = 0;
  const primaryTrack = { stop() { primaryStops++; } };
  const primary = { getTracks: () => [primaryTrack], getVideoTracks: () => [primaryTrack] };
  let f;
  f = sessionFixture({ currentDeviceId: 'ultra', devices: [lens('ultra', 'Back Ultra Wide Camera'), lens('main', 'Back Camera')],
    acquire: options => options.video.deviceId ? primary : f.stream,
  });
  assert.equal(await f.session.start(), true);
  assert.equal(f.constraints[1].video.deviceId.exact, 'main');
  assert.equal(f.constraints[1].audio, false);
  assert.equal(f.stops(), 1);
  assert.equal(f.video.srcObject, primary);
  f.session.stop();
  assert.equal(primaryStops, 1);
});

test('already selected primary lens is not reopened and failed enumeration keeps the working camera', async () => {
  for (const options of [
    { currentDeviceId: 'main', devices: [lens('main', 'Back Camera')] },
    { enumerate: async () => { throw new Error('Enumeration unavailable'); } },
  ]) {
    const f = sessionFixture(options);
    assert.equal(await f.session.start(), true);
    assert.equal(f.constraints.length, 1);
    f.session.stop();
  }
});

test('cancelled primary-lens acquisition releases the replacement without starting preview', async () => {
  let complete;
  let ready;
  const requested = new Promise(resolve => { ready = resolve; });
  const replacement = new Promise(resolve => { complete = resolve; });
  let f;
  f = sessionFixture({ devices: [lens('main', 'Back Camera')], acquire: options => {
    if (options.video.deviceId) { ready(); return replacement; }
    return f.stream;
  } });
  const start = f.session.start();
  await requested;
  f.session.stop();
  let stops = 0;
  complete({ getTracks: () => [{ stop() { stops++; } }] });
  assert.equal(await start, false);
  assert.equal(stops, 1);
  assert.equal(f.video.srcObject, null);
  assert.equal(f.decoded.length, 0);
});

test('an unavailable primary lens falls back to a working rear camera', async () => {
  let f;
  f = sessionFixture({ devices: [lens('main', 'Back Camera')], acquire: options => {
    if (options.video.deviceId) throw { name: 'OverconstrainedError' };
    return f.stream;
  } });
  assert.equal(await f.session.start(), true);
  assert.equal(f.constraints.length, 3);
  assert.equal(f.constraints[2].video.facingMode.ideal, 'environment');
  f.session.stop();
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

function terminalFixture(results, fetchFeed = async () => []) {
  const cells = [];
  let cursor = 0;
  const submissions = [];
  let feedRequests = 0;
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
    '@/lib/attendance-terminal-client': {
      fetchAttendanceFeed: async () => { feedRequests++; return fetchFeed(); },
      saveAttendanceScan: async (...args) => {
        submissions.push(args);
        return await (results.shift() ?? savedScan());
      },
    },
  });
  function flatten(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(flatten);
    return [node, ...flatten(node.props?.children)];
  }
  function render() { cursor = 0; return flatten(api.QrDeviceTerminal({ campusId: 'campus-b', onPendingChange() {} })); }
  return { render, submissions, feedRequests: () => feedRequests,
    refresh: () => render().find(node => node.type === 'Button' && node.props.children === 'Refresh').props.onClick(),
    scan: payload => render().find(node => node.type === 'CameraQrScanner').props.onScan(payload) };
}

function savedScan(overrides = {}) {
  return { success: true, isAlreadyMarked: false, student: { name: 'Aisha' }, message: 'Checked in.',
    liveEntry: { id: 'attendance-a', studentId: 'student-a', studentCode: 'STU-A', studentName: 'Aisha',
      batchName: 'Batch A', status: 'PRESENT', markedBy: 'Staff', remarks: '', timestamp: '09:30 AM',
      checkInTime: '09:30 AM', checkOutTime: null, gateStatus: 'INSIDE', ...overrides },
  };
}

function visibleText(nodes) {
  return nodes.map(node => node.props?.children).flat(Infinity).filter(value => typeof value === 'string').join(' ');
}

test('confirmed check-in appears immediately without requesting the feed again', async () => {
  const f = terminalFixture([savedScan()]);
  f.scan('STU-A');
  await new Promise(setImmediate);
  assert.match(visibleText(f.render()), /Aisha/);
  assert.match(visibleText(f.render()), /Inside/);
  assert.match(visibleText(f.render()), /09:30 AM/);
  assert.equal(f.feedRequests(), 0, 'no second server request to reflect the saved scan');
});

test('confirmed checkout replaces the same row instead of duplicating it', async () => {
  const f = terminalFixture([savedScan(), savedScan({ checkOutTime: '10:00 AM', gateStatus: 'CHECKED_OUT' })]);
  f.scan('STU-A');
  await new Promise(setImmediate);
  f.scan('STU-A');
  await new Promise(setImmediate);
  const nodes = f.render();
  assert.equal(nodes.filter(node => node.key === 'attendance-a').length, 1);
  assert.match(visibleText(nodes), /Checked out/);
  assert.match(visibleText(nodes), /10:00 AM/);
  assert.equal(f.feedRequests(), 0);
});

test('a slow stale feed request cannot erase a newer confirmed scan', async () => {
  let complete;
  const response = new Promise(resolve => { complete = resolve; });
  const f = terminalFixture([savedScan()], () => response);
  f.refresh();
  f.refresh();
  assert.equal(f.feedRequests(), 1, 'overlapping feed requests are suppressed');
  f.scan('STU-A');
  await new Promise(setImmediate);
  complete([]);
  await new Promise(setImmediate);
  assert.match(visibleText(f.render()), /Inside/);
  assert.equal(f.render().filter(node => node.key === 'attendance-a').length, 1);
});

test('pending or failed scans are never shown as saved attendance', async () => {
  let complete;
  const response = new Promise(resolve => { complete = resolve; });
  const f = terminalFixture([response]);
  f.scan('STU-A');
  assert.equal(f.render().filter(node => node.key === 'attendance-a').length, 0);
  complete({ success: false, error: 'Save failed. Please retry.' });
  await new Promise(setImmediate);
  assert.equal(f.render().filter(node => node.key === 'attendance-a').length, 0);
  assert.match(visibleText(f.render()), /Save failed/);
});

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
