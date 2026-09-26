# Test-series results handover

Prepared: 26 September 2026.

## Delivered behavior

- New candidates appear in Pending Entry. Each row can be saved individually.
- Published Results contains saved scores. Authorized staff use the pencil, then Save or Cancel. There is no permanent result lock.
- The editor displays current server results when it is not editing a draft. Saving refreshes the editor, staff Results page, student test-series results and external candidate result pages.
- Main Results now includes a separate table of test-series scores and rankings.
- Correcting marks or attendance recalculates the exam's ranks and percentiles in the same transaction. Equal scores share a rank; absent candidates have no rank.
- Editing uses the version loaded when the pencil was clicked. An outdated form cannot overwrite a newer score. Refresh and reopen the pencil if a conflict is reported.
- Every successful save records the actor, exam, previous results and submitted values in the audit log. A failed transaction commits neither results nor an audit entry.
- Results controls follow result-view/manage permissions; server actions enforce staff permission, campus and registration ownership.
- Bulk publication asks for confirmation. Untouched pending rows publish as PRESENT with zero marks. Review attendance and marks before confirming; use individual Save for partial entry.
- Switching tests asks before discarding unsaved drafts. Failed saves keep drafts available for review.
- Maximum submission size: 500 candidates. Remarks: 2,000 characters. Scores must be finite and within the configured exam maximum; counts must be nonnegative integers.

## Verification completed

- Regression suite: 124 tests passed, including edit/cancel/refresh, stale-write protection, ranking, rollback, permission and campus isolation tests.
- Optimized production build, lint and TypeScript checks passed.
- Production dependency audit: zero reported vulnerabilities at verification time.
- Configured database: all 10 migrations applied (`prisma migrate status`, read-only).
- Local production HTTP smoke check passed against the configured database: health 200 with healthy database; login 200; anonymous `/test-series` and `/results` redirected to login (307).
- No browser was available in the automation session. Authenticated visual and mobile acceptance checks remain a release gate.
- This handover does not certify unrelated ERP workflows beyond the regression suite. Production deployment has not been performed in this session.

## Release and operator checks

1. Review the complete working tree: this workspace includes earlier changes in other modules and database migrations, not only the results work. Include the intended files in the release.
2. Retain a database backup and the previous deployment identifier before release. Do not run the seed script on production.
3. The configured Vercel build runs `npm run deploy:build` (migration deploy, client generation, production build). Deploy the reviewed release to the existing `futurexlearning` project through its authorized release workflow.
4. Run `npm run test:smoke -- https://YOUR-DEPLOYMENT-HOST` after deployment. The script is read-only and checks health and anonymous access protection; it does not sign in or create records.
5. In an approved test environment/account: publish a candidate result, edit with the pencil, cancel another edit, reload and verify marks/counts/remarks. Verify the same score on Results and the student's test-series scorecard.
6. Open the same result in two sessions: save one edit, then try the older draft. The second save must report a conflict without overwriting the first.
7. Verify a view-only staff account has no edit control and a different campus cannot access or change the result. Check narrow/mobile layout and the audit event after a save.
8. Monitor application errors and `/api/health` after release. If necessary, redeploy the previous application release. Database rollback requires reviewing migration compatibility and restoring the backup; do not blindly reverse migrations.

## Commands

```sh
npm ci
npm test
npm run build
npx prisma migrate status
npm audit --omit=dev --audit-level=high
npm run start -- -p 3100
# In a second terminal:
npm run test:smoke -- http://localhost:3100
```

On Windows PowerShell where script execution is disabled, use `npm.cmd` and `npx.cmd`.
