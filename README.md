# Air Roam frontend (phase 1)

One repo, two apps, shared packages (npm workspaces):

| Path | What | Dev URL | Production |
|---|---|---|---|
| `apps/store` | Traveler web store — React Router v7 (SPA + build-time pre-rendering for SEO) | http://localhost:5173 | `airroam.ph` |
| `apps/admin` | Staff admin dashboard / CMS — Vite + React Router | http://localhost:5174 | `admin.airroam.ph` |
| `packages/ui` | Design tokens (Tailwind v4 theme), cards, badges, form fields | | |
| `packages/api` | Typed API client (access token in memory, HttpOnly refresh cookie + CSRF, 401 → refresh once) + generated OpenAPI types | | |

Designs: `../docs/superpowers/specs/2026-11-23-air-roam-*.md`, screens in `../design/web-store/`.

## Run locally

Start the backend first (`../air-roam-be/README.md`, port 8000, run `manage.py seed_demo` for demo plans and `manage.py create_staff --email … --password … --admin` for an admin login).

```powershell
npm install
npm run dev -w apps/store     # http://localhost:5173
npm run dev -w apps/admin     # http://localhost:5174
```

`VITE_API_URL` (default `http://localhost:8000/api/v1`) and `VITE_SITE_ORIGIN` (store canonical URLs, default `http://localhost:5173`) configure the apps.

## Test and build

```powershell
npm test                      # Vitest unit/component tests (all workspaces)
npm run typecheck
npx playwright test           # end-to-end: store + live backend (POST /orders mocked; no PayMongo key needed)
npm run build                 # store: pre-renders the store pages (backend must be running) + sitemap/robots; admin: static bundle
```

The backend limits login/sign-up to 5 per minute per IP — wait a minute between repeated e2e runs.

## API types

`npm run gen:api` regenerates `packages/api/src/schema.d.ts` from `../air-roam-be/schema.yml` (regenerate that with `manage.py spectacular --file schema.yml` after backend API changes).

## Hosting (later)

Both apps build to static files (Cloudflare Pages planned). Store pre-render needs the API reachable at build time; catalog saves trigger a rebuild via the backend's `WEB_REBUILD_HOOK_URL`.
