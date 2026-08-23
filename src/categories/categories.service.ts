import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(storeId: string, dto: CreateCategoryDto) {
    const slug = slugify(dto.name);

    const existing = await this.prisma.category.findFirst({
      where: { storeId, OR: [{ name: dto.name }, { slug }] },
    });

    if (existing) {
      throw new ConflictException(
        'Une catégorie avec ce nom existe déjà dans votre boutique',
      );
    }

    return this.prisma.category.create({
      data: { ...dto, storeId, slug },
    });
  }

  /** Liste des catégories d'UNE boutique — jamais toutes les boutiques.
   * `onlyActive` : la vitrine publique ne doit voir que les catégories
   * actives ; l'espace admin doit toutes les voir (pour pouvoir les
   * réactiver).
   */
  async findAll(storeId: string, onlyActive = false) {
    return this.prisma.category.findMany({
      where: { storeId, ...(onlyActive && { isActive: true }) },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Récupère une catégorie en vérifiant qu'elle appartient bien à
   * `storeId`. Si elle existe mais dans une AUTRE boutique, on renvoie
   * 404 — jamais 403 — pour ne même pas révéler qu'elle existe ailleurs.
   */
  async findOne(storeId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, storeId },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }

    return category;
  }

  async update(storeId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(storeId, id); // vérifie l'appartenance avant d'écrire

    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.name && { slug: slugify(dto.name) }),
      },
    });
  }

  async remove(storeId: string, id: string) {
    await this.findOne(storeId, id); // vérifie l'appartenance avant de supprimer

    return this.prisma.category.delete({ where: { id } });
  }
}
