import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(4000),
  WEB_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  ENABLE_SCRAPE_SCHEDULER: z.enum(['true', 'false']).default('false'),
  SCRAPE_CRON: z.string().default('0 */6 * * *'),
  SEED_DEMO: z.enum(['true', 'false']).default('false'),
});

export type AppEnv = z.infer<typeof envSchema>;
