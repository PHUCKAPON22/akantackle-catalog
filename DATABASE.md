# Database

Verified 2026-09-09: dedicated ORIGANO / akantackle-catalog project nwlennnacdrwvtsrgwkw. Initially empty. Recovery DDL was executed transactionally through the authenticated Supabase SQL editor, not through the WanderSiam connector. No managed migration-history entry was created.

## Current schema: akantackle

| Table | Columns and relationships |
| --- | --- |
| admins | user_id UUID primary key -> auth.users(id), ON DELETE CASCADE |
| categories | slug TEXT primary key; name_th/name_en TEXT required; sort_order INTEGER default 0 |
| products | id UUID generated primary key; name TEXT required; category TEXT -> categories(slug), ON DELETE RESTRICT; image_url TEXT nullable; sort_order INTEGER default 0; review_status TEXT default pending (pending/approved); status TEXT default active (active/out_of_stock/discontinued/hidden); created_at/updated_at TIMESTAMPTZ default now() |
| hero_images | id UUID generated primary key; image_url TEXT required; kind TEXT (logo/floating); sort_order INTEGER default 0; created_at TIMESTAMPTZ default now() |

Indexes: products(category), products(sort_order, created_at DESC), plus primary keys. No automatic updated_at trigger; existing client supplies updates.

## Grants and RLS
RLS enabled and verified on all four tables. anon/authenticated have schema USAGE. anon has SELECT only on products/categories/hero_images. authenticated has SELECT/INSERT/UPDATE/DELETE on those three tables and SELECT on admins.

- admins_read_self: authenticated reads only its auth.uid() membership. No client role may modify membership.
- categories_public_read / hero_public_read: public SELECT.
- products_public_read: approved review AND status active/out_of_stock AND non-null category.
- categories_admin_all / products_admin_all / hero_admin_all: authenticated operations require existence of admins.user_id = auth.uid(), both USING and WITH CHECK.

Membership checks use ordinary RLS-protected subqueries, not SECURITY DEFINER or user-editable metadata.

## Storage
Bucket akantackle-products is public-read, max 20 MiB per file, MIME types JPEG/PNG/WebP/HEIC/HEIF. Policy akantackle_storage_admin on storage.objects permits authenticated operations only inside this bucket with trusted admin membership. Public bucket URLs are readable; pending product rows are hidden but public image URLs are not private. No images uploaded yet.

## Verification
REST returns HTTP 200 for public catalog tables and denies anonymous admins access. A transaction inserted pending/public/hidden fixtures, changed to anon and verified only the approved active row visible, no anonymous INSERT privilege, and no anonymous admins SELECT privilege; all assertions passed, then ROLLBACK removed fixtures.

## Recovery limitations and planned migration
This deliberately restores the legacy frontend contract. No real products/Auth users exist. Legacy UI lacks review controls: uploads remain pending. Before real imports, add structured codes/names/prices, normalized product_images (up to 10), brands/subcategories, reviewed publish controls, pagination and previewed source sync. Inspect current objects, baseline the schema into versioned migrations and preserve RLS when extending. Never apply Akantackle SQL to WanderSiam.
