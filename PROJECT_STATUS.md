# Project status

Updated: 2026-09-10

## Current
The six requested admin improvements and guarded catalog/sub-catalog deletion are deployed to production. A Supabase service incident on 2026-09-10 was recovered by restarting the dedicated project. The backend is healthy again, and production now cancels slow catalog reads and shows a retry action instead of waiting indefinitely.

## Identity and rollback
- GitHub: PHUCKAPON22/akantackle-catalog, master. Connector verified as owner with push permission.
- Catalog deletion release: 022a7d9c28d9bbfb6dac206b8c7fbd90e6710f94. Vercel deployment mK9rLGFgPCeY6L3xJ5q8aUzp39M8 completed successfully; the production alias and deployed AdminPage asset were verified.
- Availability release: 4663a83aaa72ec68f09885f7f6609bd9462fe7cf. Vercel deployment GfcpcmWpEvyfcxnckJyEwB2n561e completed successfully and the production timeout behavior was verified against the incident before backend recovery.
- Released feature commit: 1a9da77b0d7c38e3852585e9ddccd0a3f14c9ae3 (local source commit 1ed013c). Vercel deployment 8Xjupxc1VGSvyTZPcDi6o2jDsM3n is Ready, built in 15 seconds at 15:57 Asia/Bangkok on 2026-09-09. Production alias verified.
- Frontend rollback: c5b3eb9d2218ba8a504c8e20b583809225ba4ed7; production deployment A2fM2y52BANVtSEFsFDWudUd7qBT was Ready and verified before this release.
- Supabase: ORIGANO / akantackle-catalog, nwlennnacdrwvtsrgwkw, Singapore. Production URL: https://akantackle-catalog.vercel.app.
- First store admin exists with confirmed Auth account and trusted admins membership. No credentials are stored here.

## Done
- Create main catalogs and sub catalogs, with a database-enforced two-level hierarchy.
- Delete empty catalogs and sub catalogs after a named confirmation. Admin checks every assigned product, including Pending/hidden items, and requires child catalogs to be deleted first. Database foreign keys provide concurrent-write protection.
- Bulk product selection, publish/unpublish and confirmed deletion of records and associated images; floating homepage images also support bulk deletion.
- Drag ordering within a selected catalog using an atomic database function, plus touch/keyboard arrow controls.
- Logo editing for any image proportions: fit, zoom, position, visible overflow frame and saved layout. Repeated selection of the same file works; replacements use fresh URLs.
- Public data refresh every 15 seconds while visible/online and on returning to the page. Pending products stay private until explicitly published.
- Live catalog reads stop after 12 seconds, cancel superseded requests and show a retryable error instead of leaving visitors on an endless loading state.
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
- Isolated deletion UI tests verified controls for both levels, empty-catalog confirmation, blocking for a main catalog with a child, blocking for a catalog with Pending/hidden products, and visible query-error recovery. No real catalog was deleted during testing.
- Production serves the same hashed AdminPage bundle produced by the verified local build, including the catalog usage checks and named delete confirmation. Public and `/admin` routes reloaded without browser errors after deployment.
- Incident reproduction confirmed that Vercel served the application while `categories`, `products`, `hero_images`, `catalog_counts` and Auth refresh calls returned 504 from Supabase. The project dashboard reported `Unhealthy`, persistent Data API failures and `Database not usable` with `CONNECT_TIMEOUT`.
- The timeout release passes build, lint and `git diff --check`. A local production preview against the unhealthy backend replaced the loading state after 12 seconds with the retryable catalog error and category refresh warning.
- After the authorized project restart, Supabase reported `Healthy`. Production rendered 471 published products with catalog counts and images; `/admin` rendered the sign-in form normally.

## Operational notes
Supabase and Vercel connectors still expose the wrong account/no teams. Akantackle database changes used the verified ORIGANO dashboard; Vercel has a valid browser session. Never write to WanderSiam. Production Vite environment variables are configured; Preview and Development scopes are not.

Live migration 202609090002 was applied via SQL editor, without CLI migration-history entries. The recovered baseline is for fresh databases only. Do not replay either migration on live; see DATABASE.md.

The 2026-09-10 outage investigation made no database or storage writes. The user authorized the Supabase project restart; it completed successfully after several minutes. Historical error-rate advisor data can remain visible until its rolling observation window expires.

Local work is in work/akantackle-catalog under the Codex task. The release branch is based on the current API-created remote history. Do not force-push the older divergent local master history.

## Next
The user can continue testing catalog administration. For deletion, products must be moved first and child sub catalogs must be deleted before their parent catalog.

## Future scope
Catalog rename, bulk product reassignment, cross-page product positioning, structured codes/brands/prices/stock, multi-image gallery editing, real product detail URLs, search/filter expansion and previewed Google Sheets sync remain future work. Storage/database operations cannot commit atomically; cleanup failures are surfaced and can need manual cleanup. HEIC decoding depends on the browser; source files are limited to 20 MiB.
