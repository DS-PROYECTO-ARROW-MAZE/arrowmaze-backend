import { IRepositorioProgreso } from '../../domain/repositories/progreso.repository.interface';
import { IRepositorioNivel } from '../../domain/repositories/nivel.repository.interface';
import { Progreso } from '../../domain/entities/progreso';
import { NivelNoEncontradoException } from '../../domain/exceptions/nivel-no-encontrado.exception';
import { CalcularPuntuacionCasoDeUso } from './calcular-puntuacion.use-case';
import {
  SincronizarProgresoDto,
  SincronizarProgresoResultadoDto,
} from '../dtos/sincronizar-progreso.dto';
import { ICasoDeUso } from '../ports/caso-de-uso.interface';
import { IGeneradorId } from '../ports/generador-id.port';

// Implements ICasoDeUso so the ticket-09 decorator stack can wrap this use case by
// composition (ADR-0004), same as CrearNivelCasoDeUso.
export class SincronizarProgresoCasoDeUso implements ICasoDeUso<
  SincronizarProgresoDto,
  SincronizarProgresoResultadoDto
> {
  constructor(
    private readonly repositorioProgreso: IRepositorioProgreso,
    private readonly repositorioNivel: IRepositorioNivel,
    private readonly calcularPuntuacionCasoDeUso: CalcularPuntuacionCasoDeUso,
    private readonly generadorId: IGeneradorId,
  ) {}

  async execute(
    dto: SincronizarProgresoDto,
  ): Promise<SincronizarProgresoResultadoDto> {
    const progresos: Progreso[] = [];

    for (const entrada of dto.progresos) {
      const nivel = await this.repositorioNivel.obtenerPorId(entrada.nivelId);
      if (!nivel) {
        throw new NivelNoEncontradoException(entrada.nivelId);
      }

      // Recompute via ticket 05's use case — the client's claimed score, if any, is
      // discarded; only the backend's {puntaje, estrellas} is trustworthy.
      const resultado = this.calcularPuntuacionCasoDeUso.ejecutar({
        nivel,
        movimientos: entrada.movimientos,
        segundosRestantes: entrada.segundosRestantes,
      });

      progresos.push(
        Progreso.crear({
          id: this.generadorId.generar(),
          jugadorId: dto.jugadorId,
          nivelId: entrada.nivelId,
          movimientos: entrada.movimientos,
          segundosRestantes: entrada.segundosRestantes,
          puntaje: resultado.puntaje,
          estrellas: resultado.estrellas,
          completadoEn: new Date(entrada.completadoEn),
        }),
      );
    }

    await this.repositorioProgreso.guardarLote(progresos);

    return { guardados: progresos.length };
  }
}
