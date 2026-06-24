import { IsUUID, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LeaderboardQueryDto {
  @ApiProperty({
    example: '00000000-0000-4000-a000-000000000000',
    description: 'UUID del nivel a consultar',
  })
  @IsUUID('all')
  idNivel!: string;

  @ApiProperty({
    example: '10',
    description: 'Cantidad máxima de entradas a retornar',
  })
  @IsNumberString()
  limite!: string;
}
