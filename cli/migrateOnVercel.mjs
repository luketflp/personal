/**
 * Runs pending Drizzle migrations before the production build on Vercel
 * (the `vercel-build` script). The root drizzle.config.ts prefers DIRECT_URL
 * for migrations and falls back to the DATABASE_URL session connection.
 *
 * Preview and development deploys skip migrations on purpose: a feature
 * branch must never mutate the production schema. Locally, VERCEL_ENV is
 * unset, so `pnpm vercel-build` also skips migrations.
 *
 * If a migration fails, the build fails and the previous deployment keeps
 * serving.
 */
import { execSync } from 'node:child_process'

const env = process.env.VERCEL_ENV

if (env === 'production') {
  console.log('VERCEL_ENV=production — applying pending migrations...')
  execSync('pnpm exec drizzle-kit migrate', { stdio: 'inherit' })
  console.log('Migrations up to date.')
} else {
  console.log(`Skipping migrations (VERCEL_ENV=${env ?? 'not set'}).`)
}
