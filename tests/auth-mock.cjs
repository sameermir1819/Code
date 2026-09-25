const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const permissions = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/permissions.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: permissions });
const redaction = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/redact-related-data.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: redaction, Date });

// Legacy business tests use in-memory actors. Permission enforcement itself is
// covered separately against the actual auth module and revocation fixtures.
exports.permissions = permissions;
exports.withAuthorizationMocks = function (mocks) {
  mocks['@/lib/redact-related-data'] ??= redaction;
  const auth = mocks['@/lib/auth'];
  if (!auth) return mocks;
  const current = async () => auth.requireAuth ? auth.requireAuth() : auth.getSession();
  auth.getEffectivePermissions ??= async actor => actor?.role === 'SUPER_ADMIN' ? permissions.ALL_PERMISSION_CODES : permissions.ROLE_PERMISSIONS[actor?.role] ?? [];
  auth.requirePermission ??= async code => {
    const actor = await current();
    if (!actor || !(await auth.getEffectivePermissions(actor)).includes(code)) throw new Error('FORBIDDEN');
    return actor;
  };
  auth.requireStaffPermission ??= async code => {
    const actor = await auth.requirePermission(code);
    if (['STUDENT', 'PARENT'].includes(actor.role)) throw new Error('FORBIDDEN');
    return actor;
  };
  return mocks;
};
