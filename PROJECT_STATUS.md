# Project status

Updated: 2026-09-09

## Current
Phase 1: backend recovery. The existing React/Vite catalog runs locally against the new dedicated Akantackle Supabase project. Production has not been updated.

## Verified identity
- GitHub: PHUCKAPON22/akantackle-catalog, master.
- Remote baseline and rollback SHA: f6d3a5094b1e1699a6898cc7f5c9a0840869580a (rechecked via GitHub API).
- Supabase: ORIGANO / akantackle-catalog, nwlennnacdrwvtsrgwkw, Singapore.
- Vercel: ORIGANO / akantackle-catalog; production branch master. Last verified deployment 8vPdkG3tt53JdLB7ddvuW2ry7HBA (Aug 9, Ready) renders blank because build-time variables were absent.

## Done
- Created four RLS-protected tables: admins, categories, products, hero_images.
- Seeded the five legacy categories with English labels. No real products or admin users created.
- Created public-read akantackle-products image bucket; writes require trusted admin membership.
- Exposed akantackle schema with minimum role grants. Disabled automatic exposure remains unchanged.
- Public product reads require approved review, active/out_of_stock status, and category. New products default to pending.
- Updated ignored local environment to the verified project's publishable credentials.
- Added startup error boundary, loading state, retry screen and asynchronous catalog-error UI.
- Added SPA rewrite for /admin on Vercel; converted public empty-state/navigation and sign-in labels to English.

## Validation
- Build and lint pass.
- Local catalog renders all five categories; no console errors on initial successful load.
- REST: categories/products/hero_images return HTTP 200. Anonymous admins access returns HTTP 401 as intended.
- Transactional RLS test: pending and hidden products excluded; only approved active product visible; anonymous insert denied; admins list private. All three assertions true; test rows rolled back.
- Missing-configuration recovery screen and direct local /admin fallback previously verified.

## Remaining issue
Production environment/deployment still pending Vercel sign-in. The installed Supabase connector still points to WanderSiam; do not use it for Akantackle. Use the verified ORIGANO browser session. Vercel connector returned no teams.
Original Desktop repository .git is unwritable from the sandbox. A working clone under the Codex task work directory preserves history for committing the verified changes. GitHub CLI authentication is invalid; no remote push has occurred.

## Next
Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the existing Vercel project, publish the recovery commit, redeploy, and verify both / and /admin in production. Create the user's first admin through an approved Auth setup, then implement the structured product/review/import workflow before importing real products.

## Scope still pending
Legacy admin has no review controls yet, so uploaded products remain pending/publicly hidden. Structured product codes/names/prices, multi-image relationships, brands/subcategories, public detail URLs, pagination, queued optimization and Google Sheets preview/approval sync are not implemented. Existing Thai admin-management copy still needs English adaptation. Do not treat backend recovery as completion of the catalog MVP.

## Saved recovery work
Source recovery commit: 280b5ca in work/akantackle-catalog under this Codex task. Git push failed (Windows credential/TLS integration; alternate verified TLS backend also failed). No remote update confirmed. Local /admin sign-in form renders; valid admin login and upload tests await creation of an admin user.

