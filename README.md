# group-watch-mvp

A Railway-ready pnpm monorepo MVP for watching external community sources, ingesting Apify scrape results, deduplicating posts, reviewing relevance manually, and keeping a private draft per post.

## Architecture summary

- `apps/api`: NestJS API with JWT auth, Prisma/PostgreSQL persistence, Apify integration, source management, scraping run logs, labels, drafts, and a scheduler.
- `apps/web`: Next.js dashboard with login/register, protected pages, source management, post review, run history, and settings.
- `packages/shared`: shared TypeScript types/constants used across the monorepo.

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
- `WEB_URL`: frontend origin for deployments.
- `NEXT_PUBLIC_API_URL`: public API base URL consumed by Next.js.
- `ENABLE_SCRAPE_SCHEDULER`: set to `true` to enable cron scraping.
- `SCRAPE_CRON`: cron expression for scheduled scraping.
- `SEED_DEMO`: set to `true` to allow seeding demo records.

## Local run instructions

1. Install dependencies with `pnpm install`.
2. Generate Prisma client with `pnpm prisma:generate`.
3. Apply database migration with `pnpm prisma:migrate`.
4. Optionally seed demo data with `pnpm prisma:seed`.
5. Start both apps with `pnpm dev`.
6. Open the web app at `http://localhost:3000` and the API at `http://localhost:4000`.

## Available scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm prisma:generate`
- `pnpm prisma:migrate`
- `pnpm prisma:seed`

## Railway deployment steps

### API service

1. Create a Railway service rooted at `apps/api`.
2. Attach a PostgreSQL plugin and copy its `DATABASE_URL` into the service variables.
3. Set environment variables from `.env.example`.
4. Configure build command: `pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build`.
5. Configure start command: `pnpm start`.
6. Run `pnpm prisma:migrate deploy` as a release command or one-time command.

### Web service

1. Create a second Railway service rooted at `apps/web`.
2. Set `NEXT_PUBLIC_API_URL` to the public API domain.
3. Configure build command: `pnpm install --frozen-lockfile && pnpm build`.
4. Configure start command: `pnpm start`.

## Security notes

- Passwords are hashed with Argon2.
- JWT secret is loaded from environment variables.
- Apify tokens are stored server-side only and never returned in full.
- Every data query scopes records by authenticated user.
- DTO validation and environment validation are enabled.

## Known limitations

- The current UI uses lightweight inline styles for deployment simplicity.
- Source editing is not exposed in the UI yet, although the API supports it.
- The scraper normalization layer is generic and may need field mapping adjustments per actor.
- Scheduled scraping runs in-process, so horizontal scaling should use a single API worker for cron execution.
