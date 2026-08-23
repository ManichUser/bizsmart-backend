import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [StoresModule], // pour réutiliser StoresService.findMine()
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
