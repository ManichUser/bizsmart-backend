import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';

// Pas encore de contrôleur ici — voir l'explication dans le message :
// on a besoin de l'authentification (savoir QUI fait la requête) avant
// de pouvoir exposer les routes HTTP de ce module.
@Module({
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
