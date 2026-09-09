# Architecture

React + TypeScript + Vite, Tailwind, React Router and Framer Motion. Existing GitHub PHUCKAPON22/akantackle-catalog master deploys to Vercel ORIGANO / akantackle-catalog.

## Application and data flow
Routes: public / and lazy /admin. A startup error boundary handles failed imports/configuration. vercel.json rewrites SPA routes to index.html while preserving /assets/. Browser clients use only the dedicated Supabase project nwlennnacdrwvtsrgwkw, schema akantackle, bucket akantackle-products. No WanderSiam dependencies.

Public catalog requests explicitly filter reviewed, visible products even when the viewer also has an admin session. Database RLS enforces the same boundary for anonymous users. Admin writes require Supabase Auth plus trusted admins membership; user-editable metadata does not grant access.

## Catalog administration
Main catalogs and one level of sub catalogs live in categories. A main catalog includes its children. The dashboard creates both levels, uploads products into either level, publishes/unpublishes selections, and deletes selected products plus their normalized images. Selection covers the current page (48 products).

Dragging a grip sends one move_product RPC; a database transaction locks and resequences the containing main catalog. Left/right controls provide a touch/keyboard alternative. Changing sub-catalog order also changes the combined main-catalog order. Reordering is available within the loaded page; cross-page positioning is not yet exposed.

## Images and refresh
Uploads queue up to 100 files with three workers, explicit per-file status and retry for failures. Files up to 20 MiB are decoded in the browser, resized to a maximum 2,000 px edge without upscaling, and encoded to WebP. SVG/GIF input is rasterized; HEIC/HEIF requires browser decoding support. Product uploads default to Pending unless the admin explicitly checks Publish after upload. Stable queued product IDs prevent duplicate retries after ambiguous responses.

New image content always uses a UUID URL, including logo replacements. Storage cache lifetime is one year for these immutable objects. Database writes are checked before deleting old files; ambiguous failures check references before deleting a new upload. Storage and database writes are not one distributed transaction, so failed cleanup is reported and may require manual cleanup.

The logo editor and public hero share LogoArtwork: a 3:1 frame, contain-fit from the source dimensions, zoom and x/y offsets, and clipping at the frame edge. The editor marks overflow. Layout JSON persists separately from the image. Existing legacy URLs remain readable until replaced.

useLiveQuery refreshes visible pages every 15 seconds, on focus/online/visibility, and after same-page admin writes. It retains successful data during refresh and rejects stale responses. This is polling, not Supabase Realtime; updates require network access. Public browsing initially loads 48 products and uses infinite loading. Counts are obtained from catalog_counts; large loaded ranges split at the API 1,000-row cap.

## Environment
VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are build-time frontend variables. The latter accepts a frontend-safe publishable key. Local values are in ignored .env.local; Production values are configured in the existing Vercel project. Preview/Development scopes were not configured. Never put backend secrets or Google credentials in Vite. Rebuild after environment changes.

## Remaining scope
Structured product codes, brands, prices, stock, multi-image editing/gallery UI, detail URLs, search and Sheets sync remain future work. product_images supports ten slots per product; the existing UI currently edits the cover (slot 0). No checkout/customer accounts.

The known read-only Sheet source is 1lSKEEHtXn6otiwXeOFONfv63d9wTgNiceznGnUewcZw. It was not read or changed for these admin-image improvements. Future sync must run server-side, map headers and preview changes for admin approval. Source owns code/name/regular price/quantity; the website owns sale price/images/review/visibility/featured.
