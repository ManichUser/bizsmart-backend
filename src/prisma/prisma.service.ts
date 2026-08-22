import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// PrismaService "hérite" de PrismaClient (l'outil généré par Prisma à
// partir de schema.prisma). En l'enveloppant dans une classe NestJS
// (@Injectable), on peut l'injecter dans n'importe quel service de
// l'application, simplement en le demandant dans le constructeur.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
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
