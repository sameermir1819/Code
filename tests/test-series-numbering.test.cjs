const test = require('node:test');
const assert = require('node:assert/strict');
const { allocateTestSeriesNumbers, compactTestSeriesRolls } = require('./test-series-numbering-fixture.cjs');

test('series rolls are namespaced while receipts share a numeric global sequence', async () => {
  const rows = [
    { rollNumber: 'TS-2026-NEET-ROLL-0002', receiptNo: 'TS-REC-2026-9999' },
    { rollNumber: 'TS-2026-JEE-ROLL-0001', receiptNo: 'TS-REC-2026-10000' },
  ];
  const tx = { testSeriesRegistration: { findMany: async () => rows } };
  const neet = await allocateTestSeriesNumbers(tx, 'NEET', 2026);
  const jee = await allocateTestSeriesNumbers(tx, 'JEE', 2026);
  assert.equal(neet.rollNumber, 'TS-2026-NEET-ROLL-0003');
  assert.equal(jee.rollNumber, 'TS-2026-JEE-ROLL-0002');
  assert.equal(neet.receiptNo, 'TS-REC-2026-10001');
  assert.equal((await allocateTestSeriesNumbers(tx, 'NEET', 2027)).receiptNo, 'TS-REC-2027-0001');
});

test('deletion compacts numeric rolls without touching receipts or another legacy series', async () => {
  const rows = [
    { id: 'other', testSeriesId: 'other', rollNumber: 'TS-2026-ROLL-0001', receiptNo: 'KEEP-1' },
    { id: 'later', testSeriesId: 'target', rollNumber: 'TS-2026-ROLL-10000', receiptNo: 'KEEP-2' },
    { id: 'earlier', testSeriesId: 'target', rollNumber: 'TS-2026-ROLL-9999', receiptNo: 'KEEP-3' },
    { id: 'different-year', testSeriesId: 'target', rollNumber: 'TS-2025-ROLL-0002', receiptNo: 'KEEP-4' },
  ];
  const tx = { testSeriesRegistration: {
    findMany: async () => rows.map(row => ({ ...row })),
    update: async ({ where, data }) => {
      assert.deepEqual(Object.keys(data), ['rollNumber']);
      assert.ok(!rows.some(row => row.id !== where.id && row.rollNumber === data.rollNumber), 'Unique constraint must hold on every update');
      Object.assign(rows.find(row => row.id === where.id), data);
    },
  } };
  await compactTestSeriesRolls(tx, ['target', 'target']);
  assert.deepEqual(rows.map(row => row.rollNumber), ['TS-2026-ROLL-0001', 'TS-2026-ROLL-0003', 'TS-2026-ROLL-0002', 'TS-2025-ROLL-0001']);
  assert.deepEqual(rows.map(row => row.receiptNo), ['KEEP-1', 'KEEP-2', 'KEEP-3', 'KEEP-4']);
});
