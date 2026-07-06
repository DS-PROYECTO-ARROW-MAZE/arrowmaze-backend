import { IRepositorioProgreso } from '../../domain/repositories/progreso.repository.interface';
import { ProgresoRespuestaDto } from '../dtos/progreso-respuesta.dto';

export class ObtenerProgresoCasoDeUso {
  constructor(private readonly repositorioProgreso: IRepositorioProgreso) {}

  async execute(jugadorId: string): Promise<ProgresoRespuestaDto[]> {
    const progresos =
      await this.repositorioProgreso.obtenerPorJugador(jugadorId);
    return progresos.map((p) => ({
      nivelId: p.nivelId,
      puntaje: p.puntaje,
      estrellas: p.estrellas,
      movimientos: p.movimientos,
      segundosRestantes: p.segundosRestantes,
      completadoEn: p.completadoEn,
    }));
  }
}
