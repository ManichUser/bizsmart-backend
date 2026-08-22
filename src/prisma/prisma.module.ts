import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() : ce module n'a besoin d'être importé qu'UNE fois (dans
// AppModule). Ensuite, PrismaService est utilisable partout dans
// l'application sans le réimporter dans chaque module — pratique car
// presque tous les modules métier auront besoin de parler à la base.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
