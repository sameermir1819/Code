const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadAllocator() {
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../src/lib/student-identifiers.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  vm.runInNewContext(source, { exports, require: id => {
    if (id === '@prisma/client') return {};
    throw new Error(`Unexpected module: ${id}`);
  } });
  return exports.allocateStudentIdentifiers;
}

function transaction() {
  const codes = new Map([['hawal', 'HAWAL'], ['parraypora', 'FX_PARRAYPORA']]);
  const sequences = new Map();
  return {
    institute: { findUnique: async ({ where }) => codes.has(where.id) ? { code: codes.get(where.id) } : null },
    studentIdSequence: {
      upsert: async ({ where, create }) => {
        const key = `${where.instituteId_year.instituteId}:${where.instituteId_year.year}`;
        const nextNumber = sequences.has(key) ? sequences.get(key) + 1 : create.nextNumber;
        sequences.set(key, nextNumber);
        return { nextNumber };
      },
    },
  };
}

test('student IDs contain the campus code and keep independent yearly sequences', async () => {
  const allocate = loadAllocator();
  const tx = transaction();
  const date = new Date('2026-04-01T00:00:00Z');

  assert.deepEqual(JSON.parse(JSON.stringify(await allocate(tx, 'hawal', date))), {
    studentId: 'HAW-26-001', admissionNo: 'ADM-HAW-26-001',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(await allocate(tx, 'parraypora', date))), {
    studentId: 'PAR-26-001', admissionNo: 'ADM-PAR-26-001',
  });
  assert.equal((await allocate(tx, 'hawal', date)).studentId, 'HAW-26-002');
});
