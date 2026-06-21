import {
  Controller,
  Post,
  Put,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CrearNivelCasoDeUso } from '../../../../application/use-cases/crear-nivel.use-case';
import { ActualizarNivelCasoDeUso } from '../../../../application/use-cases/actualizar-nivel.use-case';
import { ObtenerNivelCasoDeUso } from '../../../../application/use-cases/obtener-nivel.use-case';
import { CrearNivelRequestDto } from '../dtos/crear-nivel-request.dto';
import { ActualizarNivelRequestDto } from '../dtos/actualizar-nivel-request.dto';

@Controller('levels')
export class LevelsController {
  constructor(
    private readonly crearNivelCasoDeUso: CrearNivelCasoDeUso,
    private readonly actualizarNivelCasoDeUso: ActualizarNivelCasoDeUso,
    private readonly obtenerNivelCasoDeUso: ObtenerNivelCasoDeUso,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CrearNivelRequestDto) {
    return this.crearNivelCasoDeUso.execute(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.obtenerNivelCasoDeUso.execute(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: ActualizarNivelRequestDto,
  ) {
    return this.actualizarNivelCasoDeUso.execute(id, dto);
  }
}
