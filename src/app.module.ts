import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [
    // Charge le fichier .env une seule fois pour toute l'application.
    // isGlobal: true -> plus besoin de le réimporter ailleurs.
    ConfigModule.forRoot({ isGlobal: true }),

    // Notre pont vers la base de données (voir prisma.module.ts).
    PrismaModule,

    // Gestion des boutiques (tenants). Pas encore de routes HTTP
    // exposées (voir stores.module.ts) — en attente du module Auth.
    StoresModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
