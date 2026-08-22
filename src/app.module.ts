import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { StoresModule } from './stores/stores.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Charge le fichier .env une seule fois pour toute l'application.
    // isGlobal: true -> plus besoin de le réimporter ailleurs.
    ConfigModule.forRoot({ isGlobal: true }),

    // Protection anti brute-force globale (en plus des limites plus
    // strictes posées sur /auth/register et /auth/login).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Notre pont vers la base de données (voir prisma.module.ts).
    PrismaModule,

    // Inscription, connexion, refresh tokens avec rotation.
    AuthModule,

    // Gestion des boutiques (tenants).
    StoresModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
