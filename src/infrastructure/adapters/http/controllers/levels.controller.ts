import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CrearNivelCasoDeUso } from '../../../../application/use-cases/crear-nivel.use-case';
import { CrearNivelRequestDto } from '../dtos/crear-nivel-request.dto';

@Controller('levels')
export class LevelsController {
  constructor(private readonly crearNivelCasoDeUso: CrearNivelCasoDeUso) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CrearNivelRequestDto) {
    return this.crearNivelCasoDeUso.execute(dto);
  }
}
