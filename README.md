# Akantackle Catalog

Existing React + TypeScript + Vite fishing-tackle catalog. Read PROJECT_STATUS.md before continuing; DATABASE.md describes the actual recovery schema and its limitations.

## Local development
1. Install dependencies with npm ci.
2. Copy .env.example to .env.local and set the dedicated Akantackle project's VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (publishable key). Never use WanderSiam or backend secret keys.
3. Run npm run dev.
4. Run npm run build and npm run lint before publishing.

Public catalog: /. Admin sign-in: /admin. Admin authorization requires a trusted admins table membership in addition to Supabase Auth. There is no public sign-up flow.

## Recovery state
The new dedicated backend is connected locally. The production deployment still needs Vercel environment configuration and deployment. Pending/hidden products are excluded by RLS. Legacy admin review controls and expanded product/import features are not yet implemented; do not bulk-import real products yet.

Production target: https://akantackle-catalog.vercel.app. Preserve the existing Vercel project and GitHub master branch. Document environment/deployment state in PROJECT_STATUS.md after releases.
