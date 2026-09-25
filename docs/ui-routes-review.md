# UI, routes and permission fixes - 25 September 2026

## Completed

- Responsive staff navigation, mobile menu, compact header and print layout.
- Correct sidebar highlighting and timetable shortcut query handling.
- Search ignores stale responses and provides loading, error and close controls.
- Timetable route shows the weekly campus schedule; teachers see their own classes.
- Populated campuses cannot be deleted. Row locks protect the check/delete operation; the last campus is protected too.
- Search results require effective module permissions and authorized campus scope.
- Finance reports and dashboard/KPI totals include posted original payments and subtract refunds once. Refunds use refundDate and India calendar boundaries. Student receipt history includes partial/full refunds.
- New files use private storage, upload permissions, UUID filenames, content checks and owner metadata. Downloads enforce module and material access, reject traversal/symlink escapes, and use attachment/no-store headers. Legacy upload URLs pass through authorization.
- 111 protected server actions check their primary module permission before data access. Staff actions reject student/parent callers even if they have a corresponding self-service permission.
- Effective access comes from database role grants and explicit user overrides. Database errors fail closed. Role initialization preserves removed grants and only applies defaults to new roles/new module controls.
- Navigation, search and selected management controls use effective permissions. Related fees/results/material/timetable data is redacted in composite detail responses. Combined dashboards require the permissions of their included modules.
- Exports additionally require the permissions of the exported data. Permission changes invalidate the application layout.
- Student test-series self-registration creates a pending payment; it cannot confirm that money was received. The student slip shows the actual payment status.
- Announcement author responses expose only ID and display name.

## Verification

- 95 tests passed, including revocation checks for 111 protected actions, direct grants for custom roles, catalog preservation, file permissions, ownership and financial regressions.
- TypeScript passed. Lint: zero errors, 14 existing warnings.
- Static route inventory from the UI review: 47 pages, 150 literal destinations, no missing destinations. Dynamic record IDs and authenticated browser rendering are not covered by this inventory.
- Local HTTP checks: unauthenticated new/legacy download URLs and upload POST return 401; timetable and settings redirect to login.

## Limits

Interactive browser verification is still unavailable. The earlier runtime failed with a missing sandboxPolicy field. The updated advertised Browser package directory exists but its SKILL.md/runtime files are absent. Responsive behavior still needs visual verification in a working browser.

No live records were deleted or modified for these tests. No deployment was performed. Card/device features remain deferred; their server actions now also enforce module permissions.

The primary action mapping is in action-permission-map.json. Profile/password changes and personal notifications retain ownership checks; public admission enquiries retain their public flow. Some combined views need multiple read permissions, and protected super-admin-only operations retain that boundary.
