import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ActualizarNivelRequestDto {
  @IsString()
  nombre!: string;

  @IsString()
  dificultad!: string;

  @IsNumber()
  @Min(1)
  ancho!: number;

  @IsNumber()
  @Min(1)
  alto!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CeldaActualizarDto)
  celdas!: CeldaActualizarDto[][];

  @IsNumber()
  @Min(0)
  baseNivel!: number;

  @IsNumber()
  @Min(0)
  kmov!: number;

  @IsNumber()
  @Min(0)
  ktiempo!: number;

  @IsNumber()
  @Min(0)
  umbralEstrella1!: number;

  @IsNumber()
  @Min(0)
  umbralEstrella2!: number;

  @IsNumber()
  @Min(0)
  umbralEstrella3!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limiteTiempo?: number;
}

class CeldaActualizarDto {
  @IsString()
  @IsIn(['flecha', 'pared', 'vacia', 'coleccionable', 'ausente'])
  tipo!: 'flecha' | 'pared' | 'vacia' | 'coleccionable' | 'ausente';

  @IsOptional()
  @IsString()
  direccion?: string;
}
