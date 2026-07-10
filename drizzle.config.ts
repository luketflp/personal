import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit needs a migratable (session) connection, not the :6543
// transaction pooler. Prefer DIRECT_URL; otherwise derive it from DATABASE_URL
// by swapping the pooler port :6543 -> :5432 (session mode).
const migrationUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL?.replace(':6543', ':5432') ??
  ''

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: migrationUrl },
  strict: true,
  verbose: true,
})
