import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

// Un simple contrôleur de vérification : permet de confirmer que le
// serveur répond, sans dépendre de la base de données ou de
// l'authentification. Utile pour les health checks d'hébergement.
@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'bizsmart-backend' };
  }
}
