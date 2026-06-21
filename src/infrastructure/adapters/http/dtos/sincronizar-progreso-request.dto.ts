import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProgresoEntradaRequestDto {
  @IsUUID()
  nivelId!: string;

  @IsInt()
  @Min(0)
  movimientos!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  segundosRestantes?: number;

  @IsDateString()
  completadoEn!: string;
}

export class SincronizarProgresoRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProgresoEntradaRequestDto)
  progresos!: ProgresoEntradaRequestDto[];
}
