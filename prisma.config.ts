import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// We deliberately do NOT set `datasource.url` here. Overriding it forced every CLI
// command onto DATABASE_URL (the 6543 transaction pooler), which breaks `prisma db push`
// with `prepared statement "s1" already exists`.
//
// Instead, the datasource is defined entirely in prisma/schema.prisma:
//   url       = env("DATABASE_URL")  -> pooler (6543), used at runtime
//   directUrl = env("DIRECT_URL")    -> direct/session (5432), used by the CLI
// `import 'dotenv/config'` above just makes sure the .env values are loaded.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
});
