const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadStudentUserHelper() {
  const file = path.join(root, 'src/lib/student-user.ts');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(id) {
      if (id === '@/lib/auth') {
        return { hashPassword: async password => `hashed:${password}` };
      }
      throw new Error(`Unexpected module: ${id}`);
    },
  });
  return exports;
}

function transaction(existingUsers = []) {
  const users = new Map(existingUsers.map(user => [user.email, user]));
  const linkedRoles = [];
  return {
    users,
    linkedRoles,
    tx: {
      user: {
        findUnique: async ({ where }) => users.get(where.email) || null,
        create: async ({ data }) => {
          const user = { id: `user-${users.size + 1}`, ...data };
          users.set(user.email, user);
          return user;
        },
      },
      role: {
        findUnique: async () => ({ id: 'student-role' }),
      },
      institute: {
        findUnique: async () => ({ name: 'Main Campus' }),
      },
      userRole: {
        create: async ({ data }) => linkedRoles.push(data),
      },
    },
  };
}

test('student account uses the student email, links the profile, and defaults password to student ID', async () => {
  const { createStudentUser } = loadStudentUserHelper();
  const fixture = transaction();
  const user = await createStudentUser(fixture.tx, {
    id: 'student-1',
    instituteId: 'campus-1',
    name: 'Aarav Sharma',
    email: 'Aarav@example.com',
    phone: '1234567890',
    studentId: 'STU-2026-0001',
    status: 'ACTIVE',
  });

  assert.equal(user.email, 'aarav@example.com');
  assert.equal(user.passwordHash, 'hashed:STU-2026-0001');
  assert.equal(user.role, 'STUDENT');
  assert.equal(user.student.connect.id, 'student-1');
  assert.equal(fixture.linkedRoles.length, 1);
  assert.equal(fixture.linkedRoles[0].userId, user.id);
  assert.equal(fixture.linkedRoles[0].roleId, 'student-role');
});

test('student account uses a unique student address when the supplied email is already a user', async () => {
  const { createStudentUser } = loadStudentUserHelper();
  const fixture = transaction([{ id: 'staff-1', email: 'shared@example.com' }]);
  const user = await createStudentUser(fixture.tx, {
    id: 'student-2',
    instituteId: 'campus-1',
    name: 'Aarav Sharma',
    email: 'shared@example.com',
    phone: null,
    studentId: 'STU-2026-0002',
    status: 'COMPLETED',
  });

  assert.equal(user.email, 'stu-2026-0002@student.local');
  assert.equal(user.status, 'INACTIVE');
});

test('student account provisioning reports a collision on the generated address', async () => {
  const { createStudentUser } = loadStudentUserHelper();
  const fixture = transaction([
    { id: 'staff-1', email: 'shared@example.com' },
    { id: 'staff-2', email: 'stu-2026-0003@student.local' },
  ]);
  await assert.rejects(
    createStudentUser(fixture.tx, {
      id: 'student-3',
      instituteId: 'campus-1',
      name: 'Student',
      email: 'shared@example.com',
      phone: null,
      studentId: 'STU-2026-0003',
      status: 'ACTIVE',
    }),
    /already in use/
  );
});
