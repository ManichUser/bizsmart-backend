import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Depuis Prisma 7, ce fichier remplace le bloc `datasource { url = ... }`
// qui vivait auparavant dans schema.prisma. C'est ce que lit la commande
// `prisma migrate` pour savoir à quelle base se connecter.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
