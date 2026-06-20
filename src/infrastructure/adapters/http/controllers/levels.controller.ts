import {
  Controller,
  Post,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CrearNivelCasoDeUso } from '../../../../application/use-cases/crear-nivel.use-case';
import { ActualizarNivelCasoDeUso } from '../../../../application/use-cases/actualizar-nivel.use-case';
import { CrearNivelRequestDto } from '../dtos/crear-nivel-request.dto';
import { ActualizarNivelRequestDto } from '../dtos/actualizar-nivel-request.dto';

@Controller('levels')
export class LevelsController {
  constructor(
    private readonly crearNivelCasoDeUso: CrearNivelCasoDeUso,
    private readonly actualizarNivelCasoDeUso: ActualizarNivelCasoDeUso,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CrearNivelRequestDto) {
    return this.crearNivelCasoDeUso.execute(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: ActualizarNivelRequestDto,
  ) {
    return this.actualizarNivelCasoDeUso.execute(id, dto);
  }
}
