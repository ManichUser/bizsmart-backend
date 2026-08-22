import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

// Passport appelle automatiquement validate() une fois le JWT décodé et
// sa signature vérifiée (donc on sait déjà qu'il n'a pas été trafiqué).
// Ce qu'on retourne ici devient `req.user` dans tous les contrôleurs.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET') as string,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    if (!user) {
      // Le token est valide, mais le compte a été supprimé entre-temps.
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return user;
  }
}
