import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// PrismaService "hérite" de PrismaClient (l'outil généré par Prisma à
// partir de schema.prisma). En l'enveloppant dans une classe NestJS
// (@Injectable), on peut l'injecter dans n'importe quel service de
// l'application, simplement en le demandant dans le constructeur.
//
// Depuis Prisma 7, PrismaClient exige un "adaptateur" de connexion
// explicite (ici PrismaPg, pour PostgreSQL) — Prisma ne devine plus la
// base de données tout seul à partir du schéma.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  // Appelé automatiquement au démarrage de l'application : on ouvre la
  // connexion à la base une seule fois.
  async onModuleInit() {
    await this.$connect();
  }

  // Appelé automatiquement à l'arrêt de l'application : on ferme la
  // connexion proprement.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
