import {
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Un DTO (Data Transfer Object) décrit "ce que le client a le droit
// d'envoyer" pour une action donnée. class-validator vérifie
// automatiquement ces règles avant que le code métier ne s'exécute —
// par exemple, si `name` est vide, la requête est rejetée avant même
// d'arriver dans notre service.
export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  // Géolocalisation exacte (optionnelle), comme décidé.
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
