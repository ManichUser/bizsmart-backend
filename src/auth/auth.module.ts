import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PassportModule,
    // JwtModule.registerAsync : configure @nestjs/jwt à partir des
    // variables d'environnement (via ConfigService), plutôt que des
    // valeurs codées en dur.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION', '10m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // JwtAuthGuard devient le garde PAR DÉFAUT de toute l'application :
    // chaque route est protégée sauf celles marquées @Public().
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Appliqué APRÈS JwtAuthGuard (l'ordre de déclaration compte : il
    // faut que req.user existe avant de pouvoir vérifier son rôle).
    // Sans @Roles(...) sur une route, ce garde ne fait rien.
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
