import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

// Étend le type Request d'Express pour que TypeScript sache que
// `req.store` existe (sinon il crierait "propriété inconnue" partout où
// on essaie de la lire).
declare module 'express' {
  interface Request {
    store?: {
      id: string;
      slug: string;
      name: string;
      status: string;
    } | null;
  }
}

/**
 * S'exécute sur CHAQUE requête, avant tout contrôleur. Regarde le nom
 * d'hôte (`Host`) envoyé par le navigateur et essaie d'en extraire un
 * sous-domaine de boutique.
 *
 * Ex: Host = "patisserie-marie.lvh.me:3001", ROOT_DOMAIN = "lvh.me"
 *  -> slug détecté = "patisserie-marie"
 *  -> req.store = la boutique correspondante (ou null si aucune trouvée)
 *
 * Ex: Host = "lvh.me:3001" (pas de sous-domaine, domaine racine)
 *  -> req.store = null (on est sur le site principal / l'API globale)
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = (req.headers.host || '').split(':')[0]; // retire le port
    const rootDomain = this.config.get<string>('ROOT_DOMAIN', 'lvh.me');

    req.store = null;

    const isSubdomain = host !== rootDomain && host.endsWith(`.${rootDomain}`);

    if (isSubdomain) {
      const slug = host.slice(0, -(rootDomain.length + 1));
      req.store = await this.prisma.store.findUnique({
        where: { slug },
        select: { id: true, slug: true, name: true, status: true },
      });
    }

    next();
  }
}
