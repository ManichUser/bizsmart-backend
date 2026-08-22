import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreDto } from './create-store.dto';

// PartialType() prend un DTO existant et rend TOUS ses champs optionnels
// — évite de dupliquer les mêmes règles de validation pour la mise à
// jour. Le slug n'est volontairement pas dans CreateStoreDto (on le
// génère nous-même, voir stores.service.ts), donc il n'est pas non plus
// modifiable ici.
export class UpdateStoreDto extends PartialType(CreateStoreDto) {}
