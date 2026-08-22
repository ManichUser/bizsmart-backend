import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Le point de départ : NestFactory.create() construit toute l'application
// à partir du module racine (AppModule), puis on la fait écouter sur un
// port réseau.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001;

  await app.listen(port);
  console.log(`BizSmart backend démarré sur http://localhost:${port}`);
}

bootstrap();
