# Project status

Updated: 2026-09-09

## Current
The six requested admin improvements are deployed to production. The additive migration is applied to the dedicated live backend. Public catalog and direct admin sign-in were reloaded and verified after deployment.

## Identity and rollback
- GitHub: PHUCKAPON22/akantackle-catalog, master. Connector verified as owner with push permission.
- Released feature commit: 1a9da77b0d7c38e3852585e9ddccd0a3f14c9ae3 (local source commit 1ed013c). Vercel deployment 8Xjupxc1VGSvyTZPcDi6o2jDsM3n is Ready, built in 15 seconds at 15:57 Asia/Bangkok on 2026-09-09. Production alias verified.
- Frontend rollback: c5b3eb9d2218ba8a504c8e20b583809225ba4ed7; production deployment A2fM2y52BANVtSEFsFDWudUd7qBT was Ready and verified before this release.
- Supabase: ORIGANO / akantackle-catalog, nwlennnacdrwvtsrgwkw, Singapore. Production URL: https://akantackle-catalog.vercel.app.
- First store admin exists with confirmed Auth account and trusted admins membership. No credentials are stored here.

## Done
- Create main catalogs and sub catalogs, with a database-enforced two-level hierarchy.
- Bulk product selection, publish/unpublish and confirmed deletion of records and associated images; floating homepage images also support bulk deletion.
- Drag ordering within a selected catalog using an atomic database function, plus touch/keyboard arrow controls.
- Logo editing for any image proportions: fit, zoom, position, visible overflow frame and saved layout. Repeated selection of the same file works; replacements use fresh URLs.
- Public data refresh every 15 seconds while visible/online and on returning to the page. Pending products stay private until explicitly published.
- 48-product pagination and public infinite loading; upload queue of 100 files with three workers, optimization, explicit errors and retry without duplicating completed uploads.
- Normalized product_images table with cover backfill, RLS and cascading deletion. Schema migrations and operating documentation are versioned.
- Existing user data preserved. Readback found 253 product covers and 253 normalized images, zero test catalogs and five RLS-protected tables.

## Validation
- Build, lint and three unit tests pass. Production was reloaded after Ready: the real logo/floating images and five catalog buttons render, the new publication-aware empty state appears, direct /admin renders the sign-in form, and no browser error logs were reported.
- Transactional database tests passed for hierarchy, ordering, public visibility/counts, non-admin denial and cascade deletion; fixtures were rolled back before applying the migration.
- Isolated UI tests passed for catalog/sub-catalog creation, native drag ordering, selected publish/delete, logo overflow and saved edit values.
- A separate local mock backend verified repeated logo uploads use different URLs, old-file cleanup succeeds, and another independently opened catalog updates its image/layout without reload.
- Mixed valid/invalid upload queue saved two images as Pending, reported the invalid file, and retry did not duplicate completed products. Publishing made both visible in the separate client; bulk deletion removed both records and files.
- Actual new authenticated mutations against production have not been repeated: the agent's in-app /admin session is signed out. User data was not used as test fixtures. Browser viewport override did not take effect, so mobile-width visual verification is not claimed.

## Operational notes
Supabase and Vercel connectors still expose the wrong account/no teams. Akantackle database changes used the verified ORIGANO dashboard; Vercel has a valid browser session. Never write to WanderSiam. Production Vite environment variables are configured; Preview and Development scopes are not.

Live migration 202609090002 was applied via SQL editor, without CLI migration-history entries. The recovered baseline is for fresh databases only. Do not replay either migration on live; see DATABASE.md.

Local work is in work/akantackle-catalog under the Codex task. Its commits differ from the API-created remote release history. Publish snapshots on top of the current verified remote master; do not force-push divergent local history.

## Next
The user can refresh their authenticated /admin page to receive the new tools, then review a few existing Pending images and choose Publish selected. A separate viewer receives published updates within approximately 15 seconds while visible and online. This documentation follow-up records the verified feature deployment; subsequent documentation-only commits do not change the tested application code.

## Future scope
Catalog rename/delete, cross-page product positioning, structured codes/brands/prices/stock, multi-image gallery editing, real product detail URLs, search/filter expansion and previewed Google Sheets sync are not part of this six-item release. Storage/database operations cannot commit atomically; cleanup failures are surfaced and can need manual cleanup. HEIC decoding depends on the browser; source files are limited to 20 MiB.

