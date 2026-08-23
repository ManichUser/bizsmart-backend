import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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

  // Vitrine publique : n'importe quel visiteur (même pas connecté) doit
  // pouvoir consulter une boutique par son identifiant d'URL (le futur
  // sous-domaine). @Public() ouvre la route malgré le guard global.
  @Public()
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.storesService.findBySlug(slug);
  }
}
