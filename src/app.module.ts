import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

// Le module racine. Pour l'instant il ne contient que le contrôleur de
// health check — chaque brique métier (Store, Auth, Products...)
// viendra s'ajouter ici, une à une, dans le tableau `imports`.
@Module({
  controllers: [AppController],
})
export class AppModule {}
