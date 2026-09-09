# Architecture

React + TypeScript + Vite, Tailwind, React Router, Framer Motion. GitHub PHUCKAPON22/akantackle-catalog master deploys to existing Vercel ORIGANO / akantackle-catalog.

## Application
Entry point lazily imports App inside a React error boundary, with visible loading and retry fallback. Catalog query errors have a separate retry state. Routes: / and lazy /admin. vercel.json rewrites application routes to index.html, excluding /assets/; pending deployment verification.

Browser -> dedicated Supabase Data API / Auth / Storage. Project nwlennnacdrwvtsrgwkw (ORIGANO), schema akantackle, bucket akantackle-products. Public reads are protected by database policies; admin mutations require trusted admins membership. No WanderSiam dependencies.

## Environment
VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are build-time frontend variables. The latter accepts a frontend-safe publishable key. Values are kept in ignored .env.local locally and must be configured in Vercel. Never put service_role, secret keys, or Google credentials into Vite. Production must be rebuilt after environment changes.

## Current limits
Legacy products have one image/name/category. Target structured model and admin review controls remain pending. No checkout/customer accounts. Current product hook loads the legacy list; pagination must precede importing the intended 5,000-product catalog.

## Planned Google Sheets integration
Source 1lSKEEHtXn6otiwXeOFONfv63d9wTgNiceznGnUewcZw is read-only. It has not been inspected/imported during backend recovery. Future server-side access maps by headers, previews changes and requires admin approval before applying. Source wins for code/name/regular price/quantity; web app wins for sale price/images/review/visibility/featured. Never write the source Sheet during sync; keep Google credentials server-side.
