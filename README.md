# Akantackle Catalog

React + TypeScript + Vite fishing-tackle catalog. Read PROJECT_STATUS.md before continuing. DATABASE.md describes the applied schema and migration history.

## Development
1. Install dependencies with npm ci.
2. Copy .env.example to .env.local; configure the dedicated Akantackle VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (publishable key).
3. Run npm run dev.
4. Verify npm run build, npm run lint, and node --experimental-strip-types --test tests/catalog.test.ts.

Public catalog: /. Admin: /admin. Supabase Auth and trusted admins membership are required; there is no public sign-up flow. Never use WanderSiam or backend-only credentials.

## Admin workflow
- Catalogs: create a main catalog, or select a parent to create a sub catalog.
- Upload: choose a catalog, review the queue and upload. Leave publication unchecked to keep test images Pending.
- Select product checkboxes for Publish selected, Unpublish or Delete selected. Selection covers the current 48-product page; deletion names the selected records before confirmation.
- Choose a catalog and drag product grips to change display order. Arrow buttons provide a touch/keyboard alternative.
- Homepage: replace the logo, adjust zoom and position, check the frame and Save logo. Edit logo reopens the saved layout. Floating homepage images also support multiple selection/deletion.
- Public pages refresh within approximately 15 seconds while visible and connected. Products must be published to appear on a shared link. Logo replacements use fresh URLs to avoid stale image caches.

Production: https://akantackle-catalog.vercel.app. Existing Vercel Production variables are configured. Preserve the project and master branch. See ARCHITECTURE.md for current limits and future product/Sheets work.
