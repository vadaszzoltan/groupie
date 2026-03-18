# group-watch-mvp

A Railway-ready pnpm monorepo MVP for watching external community sources, ingesting Apify scrape results, deduplicating posts, reviewing relevance manually, and keeping a private draft per post.

## Architecture summary

- `apps/api`: NestJS API with JWT auth, Prisma/PostgreSQL persistence, Apify integration, source management, scraping run logs, labels, drafts, and a scheduler. The API uses the standard `@prisma/client` package generated from `apps/api/prisma/schema.prisma`.
- `apps/web`: Next.js dashboard with login/register, protected pages, source management, post review, run history, and settings.
- `packages/shared`: shared TypeScript types/constants used across the monorepo and built to `dist/` for runtime resolution by the API and web apps.

## Monorepo structure

- `apps/api`
- `apps/web`
- `packages/shared`

## Environment variables

Copy `.env.example` to `.env` and update values.

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: long random string used to sign JWTs.
- `JWT_EXPIRES_IN`: token lifetime, for example `7d`.
- `PORT`: API port, default `4000`.
- `WEB_URL`: frontend origin used for API CORS.
- `NEXT_PUBLIC_API_URL`: public API base URL consumed by Next.js.
- `ENABLE_SCRAPE_SCHEDULER`: set to `true` to enable cron scraping.
- `SCRAPE_CRON`: cron expression for scheduled scraping.
- `SEED_DEMO`: set to `true` to allow seeding demo records.

## Local run instructions

1. Install dependencies with `pnpm install`. This runs the root `postinstall` hook to build `@group-watch/shared` and generate the Prisma client for the API.
2. Generate Prisma client with `pnpm prisma:generate`.
3. Apply database migration with `pnpm prisma:migrate`.
4. Optionally seed demo data with `pnpm prisma:seed`.
5. Start both apps with `pnpm dev`.
6. Open the web app at `http://localhost:3000` and the API at `http://localhost:4000`.
7. Verify the health endpoint at `http://localhost:4000/health`.

## Available scripts

- `pnpm dev`
- `pnpm build` (builds shared first, then API, then web)
- `pnpm lint`
- `pnpm test`
- `pnpm prisma:generate`
- `pnpm build:shared`
- `pnpm build:api`
- `pnpm build:web`
- `pnpm prisma:migrate`
- `pnpm prisma:seed`
- `pnpm --filter @group-watch/api start`
- `pnpm --filter @group-watch/web start`

## Railway deployment steps

Railway should build from the **repository root** so the workspace package (`packages/shared`) is available to both apps. The repository no longer ignores `pnpm-lock.yaml`, so future installs can commit a lockfile, but the documented build commands do not require one to exist.

### API service

1. Create a Railway service from this repository and keep the root directory as the repo root.
2. Attach a PostgreSQL plugin and copy its `DATABASE_URL` into the service variables.
3. Set `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `WEB_URL`, `ENABLE_SCRAPE_SCHEDULER`, `SCRAPE_CRON`, and optional `SEED_DEMO`.
4. Configure build command: `pnpm install && pnpm build:api`. The API package prebuild step generates Prisma and builds `@group-watch/shared` first.
5. Configure start command: `pnpm --filter @group-watch/api start`.
6. Configure a release command or one-time command: `pnpm --filter @group-watch/api exec prisma migrate deploy`.
7. Point Railway health checks at `/health`.

### Web service

1. Create a second Railway service from the same repository and keep the root directory as the repo root.
2. Set `NEXT_PUBLIC_API_URL` to the deployed API URL.
3. Configure build command: `pnpm install && pnpm build:web`. The root install step already builds `@group-watch/shared` for workspace runtime resolution.
4. Configure start command: `pnpm --filter @group-watch/web start`.

## Security notes

- Passwords are hashed with Argon2.
- JWT secret is loaded from environment variables.
- Apify tokens are stored server-side only and never returned in full.
- Every data query scopes records by authenticated user.
- DTO validation and environment validation are enabled.

## Known limitations

- The current UI uses lightweight inline styles for deployment simplicity.
- Source editing is supported by the API but not yet exposed in the frontend.
- The scraper normalization layer is generic and may need field mapping adjustments per actor.
- Scheduled scraping runs in-process, so horizontal scaling should use a single API worker for cron execution.
