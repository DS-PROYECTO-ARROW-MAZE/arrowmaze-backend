import {
  Controller,
  Post,
  Body,
  Inject,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SincronizarProgresoCasoDeUso } from '../../../../application/use-cases/sincronizar-progreso.use-case';
import { I_PROVEEDOR_SESION } from '../../../../application/ports/proveedor-sesion.port';
import type { IProveedorSesion } from '../../../../application/ports/proveedor-sesion.port';
import { SincronizarProgresoRequestDto } from '../dtos/sincronizar-progreso-request.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('progress')
export class ProgressController {
  constructor(
    private readonly sincronizarProgresoCasoDeUso: SincronizarProgresoCasoDeUso,
    @Inject(I_PROVEEDOR_SESION)
    private readonly proveedorSesion: IProveedorSesion,
  ) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async sync(@Body() dto: SincronizarProgresoRequestDto) {
    // jugadorId comes from the verified session, never from the request body — a synced
    // run is trustworthy for identity the same way ticket 05 makes it trustworthy for score.
    const principal = this.proveedorSesion.obtenerPrincipal()!;

    return this.sincronizarProgresoCasoDeUso.execute({
      jugadorId: principal.id,
      progresos: dto.progresos,
    });
  }
}
