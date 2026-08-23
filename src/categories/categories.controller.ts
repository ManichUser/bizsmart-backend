import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { StoresService } from '../stores/stores.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentStore } from '../auth/decorators/current-store.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';
import { NotFoundException } from '@nestjs/common';

@Controller('categories')
export class CategoriesController {
  constructor(
    private categoriesService: CategoriesService,
    private storesService: StoresService,
  ) {}

  // ---- Routes ADMIN : storeId vient TOUJOURS du compte connecté ----
  // (jamais du sous-domaine — voir l'explication donnée avant ce bloc)

  @Post()
  @Roles(Role.ADMIN)
  async create(@CurrentUser() user: any, @Body() dto: CreateCategoryDto) {
    const store = await this.storesService.findMine(user.id);
    return this.categoriesService.create(store.id, dto);
  }

  @Get('mine')
  @Roles(Role.ADMIN)
  async findMine(@CurrentUser() user: any) {
    const store = await this.storesService.findMine(user.id);
    return this.categoriesService.findAll(store.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const store = await this.storesService.findMine(user.id);
    return this.categoriesService.update(store.id, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const store = await this.storesService.findMine(user.id);
    return this.categoriesService.remove(store.id, id);
  }

  // ---- Route PUBLIQUE : storeId vient du sous-domaine (TenantMiddleware) ----

  @Public()
  @Get()
  async findAllPublic(@CurrentStore() store: { id: string } | null) {
    if (!store) {
      throw new NotFoundException(
        "Aucune boutique associée à ce sous-domaine",
      );
    }
    return this.categoriesService.findAll(store.id, true);
  }
}
