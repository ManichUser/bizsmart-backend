import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { slugify } from '../common/utils/slugify';
import { Role } from '../generated/prisma/enums';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une boutique.
   *
   * Règle importante : un utilisateur ne peut PAS s'auto-déclarer
   * commerçant (role=ADMIN) à l'inscription — cette route est la SEULE
   * façon d'obtenir ce rôle, et elle le fait automatiquement, dans la
   * même opération que la création de la boutique.
   */
  async create(userId: string, dto: CreateStoreDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { ownedStore: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (user.role === Role.SUPER) {
      throw new ForbiddenException(
        "Un administrateur de la plateforme ne peut pas créer de boutique",
      );
    }

    if (user.ownedStore) {
      throw new ConflictException('Ce compte possède déjà une boutique');
    }

    const slug = await this.generateUniqueSlug(dto.name);

    // $transaction : soit les DEUX opérations réussissent (créer la
    // boutique ET promouvoir l'utilisateur), soit AUCUNE des deux —
    // jamais un état à moitié fait (ex: boutique créée mais rôle resté
    // "USER").
    const [store] = await this.prisma.$transaction([
      this.prisma.store.create({
        data: { ownerId: user.id, slug, ...dto },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { role: Role.ADMIN },
      }),
    ]);

    return store;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'boutique';
    let candidate = base;
    let suffix = 1;

    while (await this.prisma.store.findUnique({ where: { slug: candidate } })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }

  /** La boutique du commerçant actuellement connecté. */
  async findMine(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new NotFoundException("Vous ne possédez pas encore de boutique");
    }

    return store;
  }

  async updateMine(userId: string, dto: UpdateStoreDto) {
    const store = await this.findMine(userId);

    return this.prisma.store.update({
      where: { id: store.id },
      data: dto,
    });
  }

  /** Vitrine publique — consultation d'une boutique par son slug. */
  async findBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({ where: { slug } });

    if (!store || store.status !== 'ACTIVE') {
      throw new NotFoundException('Boutique introuvable');
    }

    return store;
  }
}
