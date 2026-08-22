import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ---- Inscription ----

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (existing) {
      throw new ConflictException(
        'Un compte existe déjà avec cet email ou ce numéro',
      );
    }

    // On ne stocke JAMAIS le mot de passe en clair. bcrypt applique un
    // "sel" aléatoire + un algorithme volontairement lent (pour rendre
    // le brute-force coûteux) et produit une empreinte à sens unique.
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
      },
    });

    const { accessToken, refreshToken } = await this.issueTokenPair(
      user.id,
      user.email,
      user.role,
    );

    return { accessToken, refreshToken };
  }

  // ---- Connexion ----

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Volontairement le MÊME message d'erreur dans les deux cas
    // (email inconnu / mot de passe faux) : ça empêche un attaquant de
    // déduire quels emails existent en observant la réponse.
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const { accessToken, refreshToken } = await this.issueTokenPair(
      user.id,
      user.email,
      user.role,
    );

    return { accessToken, refreshToken };
  }

  // ---- Rafraîchissement (avec rotation) ----

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException(
        'Session invalide, veuillez vous reconnecter',
      );
    }

    // Ce token a déjà été utilisé (ou explicitement révoqué). S'il
    // ressert, c'est le signe que quelqu'un d'autre le possède aussi
    // (vol) — on révoque TOUTE la famille de tokens de l'utilisateur
    // par précaution, et on le force à se reconnecter partout.
    if (stored.revokedAt) {
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException(
        'Activité suspecte détectée : veuillez vous reconnecter',
      );
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Session expirée, veuillez vous reconnecter',
      );
    }

    // Rotation : ce token est immédiatement invalidé, un nouveau prend
    // sa place. La chaîne replacedById permet de tracer qui a remplacé
    // qui.
    const { accessToken, refreshToken, refreshTokenRecord } =
      await this.issueTokenPair(
        stored.user.id,
        stored.user.email,
        stored.user.role,
      );

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedById: refreshTokenRecord.id },
    });

    return { accessToken, refreshToken };
  }

  // ---- Déconnexion ----

  /** Déconnecte uniquement l'appareil courant (révoque UN refresh token). */
  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Déconnecté' };
  }

  /** Déconnecte TOUS les appareils (révoque tous les refresh tokens actifs). */
  async logoutAll(userId: string) {
    await this.revokeAllForUser(userId);
    return { message: 'Déconnecté de tous les appareils' };
  }

  private async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ---- Utilitaires internes ----

  /**
   * Crée un access token (JWT court) + un refresh token (opaque, stocké
   * hashé en base) pour un utilisateur donné.
   */
  private async issueTokenPair(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '10m'),
      },
    );

    // Le refresh token n'est PAS un JWT : juste une grande chaîne
    // aléatoire imprévisible. On ne stocke que son empreinte SHA-256 en
    // base (comme un mot de passe, mais avec SHA-256 plutôt que bcrypt
    // — ici la chaîne est déjà à haute entropie, donc pas besoin d'un
    // algorithme volontairement lent).
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const refreshDays = Number(
      this.configService.get('JWT_REFRESH_EXPIRATION_DAYS', 7),
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      refreshTokenRecord,
    };
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
