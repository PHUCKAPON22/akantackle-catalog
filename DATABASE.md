# Database

Verified 2026-09-09: dedicated ORIGANO / akantackle-catalog project nwlennnacdrwvtsrgwkw. All five application tables have RLS enabled. Never apply this schema to WanderSiam.

## Schema: akantackle

| Table | Main columns and relationships |
| --- | --- |
| admins | user_id UUID primary key references auth.users, cascade on user deletion |
| categories | slug TEXT primary key; name_en/name_th required; sort_order INTEGER; parent_slug nullable self-FK, delete restrict |
| products | id UUID primary key; name required; category nullable FK to categories, delete restrict; image_url nullable cover; sort_order; review_status pending/approved, default pending; status active/out_of_stock/discontinued/hidden, default active; created_at/updated_at |
| product_images | id UUID primary key; product_id FK to products, cascade on deletion; image_url; sort_order 0..9; unique(product_id, sort_order) |
| hero_images | id UUID primary key; image_url required; kind logo/floating; sort_order; created_at; nullable layout JSONB {scale,x,y,width,height} |

Indexes include categories(parent_slug), products(category), products(sort_order,created_at DESC), products(category,sort_order,created_at DESC,id), the image slot uniqueness index, and a partial unique index allowing only one logo row.

validate_catalog_parent rejects self-parenting, more than two levels, and moving a main catalog with children below another catalog. Both categories.parent_slug and products.category use ON DELETE RESTRICT: a main catalog with children and any catalog containing products cannot be deleted. Admin performs friendly counts first, while these constraints remain the final protection against concurrent changes. sync_cover_image maintains normalized slot 0 after product insertion or cover changes. Existing 253 product covers were verified to have 253 normalized image records after migration; no agent test catalogs remained. These counts are a point-in-time readback, not seed data.

## Functions
- catalog_counts(): public read-only counts grouped by assigned catalog, explicitly approved and active/out_of_stock with a category.
- move_product(p_id UUID, p_before UUID, p_catalog TEXT, p_after BOOLEAN DEFAULT false): checks trusted admin membership and both products' catalog scope, uses an advisory transaction lock for the main catalog, and resequences that main catalog and its children. Null target appends. Frontend supplies before/after targets within the current page.

Functions use SECURITY INVOKER and an empty search_path. PUBLIC execute was revoked; only authenticated can execute move_product, and anon/authenticated can execute catalog_counts. Trigger functions have no client execute grants. Updated timestamps are supplied by client mutations and the ordering function.

## Grants and policies
anon/authenticated have schema USAGE. anon has SELECT on categories, products, product_images and hero_images. authenticated has CRUD on these tables and SELECT on admins. There are no client membership-write grants.

- admins: authenticated can read only its own auth.uid() membership.
- categories/hero_images: public SELECT.
- products: public reads require approved review, active/out_of_stock status and a non-null category.
- product_images: public reads require a parent product satisfying the same publication rules.
- All catalog table writes: authenticated plus existence of admins.user_id = auth.uid(), with both USING and WITH CHECK.

The first store admin's confirmed Auth account and exact matching membership were verified. Credentials are not stored in this repository.

## Storage
akantackle-products is public-read; the limit is 20 MiB with JPEG/PNG/WebP/HEIC/HEIF MIME types. The frontend converts supported source formats to WebP. akantackle_storage_admin permits writes/deletes only for authenticated trusted admins within this bucket. A public image URL is not private even if its product is Pending.

The new frontend writes versioned UUID paths, never overwrites the logo path, and removes previous files only after confirmed database saves. Bulk product deletion cascades image rows, then removes the corresponding objects. Storage cleanup failures are visible; database and Storage changes are not atomic together.

## Migration history
- 202609090001_recovered_baseline.sql records the reviewed recovery schema for a fresh project. It MUST NOT be executed against the already recovered live project. Recovery was applied through the verified dashboard SQL editor.
- 202609090002_catalog_admin.sql was executed transactionally through the same verified Akantackle SQL editor on 2026-09-09. The live schema already includes it; do not run it again.
- No Supabase CLI migration-history entries were created. Before adopting CLI migrations, diff the live schema and mark these versions as already applied; do not replay them.

## Verification
A transaction ran the additive migration with fixtures, checked main/sub catalog creation, before/after ordering, public visibility/counts, denial of non-admin mutations and anonymous reorder execution, hierarchy validation, and cascade deletion of selected products' images. All five grouped assertions passed; ROLLBACK removed the temporary migration and fixtures. The exact migration was then committed separately. A later readback confirmed zero test catalogs, all five RLS-protected tables and complete cover backfill.

Browser interaction tests use isolated local fixtures. They cover UI and Storage call sequencing; live authenticated Storage mutations were not repeated by the agent because the in-app admin session is signed out. Existing user uploads were preserved.
