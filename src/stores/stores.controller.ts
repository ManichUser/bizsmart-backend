import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentStore } from '../auth/decorators/current-store.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('stores')
export class StoresController {
  constructor(private storesService: StoresService) {}

  // Pas de @Public() ici : il faut être connecté. N'importe quel compte
  // (role USER) peut créer une boutique — c'est justement l'action qui
  // le transforme en ADMIN (voir StoresService.create()).
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateStoreDto) {
    return this.storesService.create(user.id, dto);
  }

  // Espace administratif du commerçant connecté.
  @Get('me')
  findMine(@CurrentUser() user: any) {
    return this.storesService.findMine(user.id);
  }

  @Patch('me')
  updateMine(@CurrentUser() user: any, @Body() dto: UpdateStoreDto) {
    return this.storesService.updateMine(user.id, dto);
  }

  // La VRAIE route de vitrine : le frontend d'une boutique l'appelle au
  // chargement, sans jamais avoir à connaître son propre slug — c'est
  // TenantMiddleware qui l'a déjà déduit du sous-domaine et posé sur
  // `req.store` (voir common/middleware/tenant.middleware.ts).
  @Public()
  @Get('current')
  findCurrent(@CurrentStore() store: { id: string } | null) {
    if (!store) {
      throw new NotFoundException(
        "Aucune boutique associée à ce sous-domaine",
      );
    }
    return this.storesService.findById(store.id);
  }

  // Conservée pour la prévisualisation depuis le domaine principal
  // (ex: back-office SUPER) — pas la voie normale d'accès à une boutique.
  @Public()
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.storesService.findBySlug(slug);
  }
}
