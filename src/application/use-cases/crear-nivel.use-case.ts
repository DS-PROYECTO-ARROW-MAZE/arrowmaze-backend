import { IRepositorioNivel } from '../../domain/repositories/nivel.repository.interface';
import { Nivel } from '../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../domain/value-objects/definicion-tablero';
import { GrafoTablero } from '../../domain/services/grafo-tablero';
import { esSolvable } from '../../domain/services/solver';
import { NivelNoSolvableException } from '../../domain/exceptions/nivel-no-solvable.exception';
import { CrearNivelDto, CrearNivelResultadoDto } from '../dtos/crear-nivel.dto';
import { ICasoDeUso } from '../ports/caso-de-uso.interface';
import { IGeneradorId } from '../ports/generador-id.port';
import { mapearCeldasDesdeDto } from './actualizar-nivel.use-case';

// Implements ICasoDeUso so the ticket-09 decorator stack (metrics/logging/security)
// can wrap this use case by composition, without editing its body (ADR-0004).
export class CrearNivelCasoDeUso implements ICasoDeUso<
  CrearNivelDto,
  CrearNivelResultadoDto
> {
  constructor(
    private readonly repositorioNivel: IRepositorioNivel,
    private readonly generadorId: IGeneradorId,
  ) {}

  async execute(dto: CrearNivelDto): Promise<CrearNivelResultadoDto> {
    const celdas = mapearCeldasDesdeDto(dto.celdas);

    const tablero = new GrafoTablero(dto.ancho, dto.alto, celdas);
    if (!esSolvable(tablero)) {
      throw new NivelNoSolvableException();
    }

    const definicion = DefinicionTablero.crear(dto.ancho, dto.alto, celdas);

    const nivel = Nivel.crear({
      id: this.generadorId.generar(),
      nombre: dto.nombre,
      dificultad: dto.dificultad,
      definicionTablero: definicion,
      ancho: dto.ancho,
      alto: dto.alto,
      baseNivel: dto.baseNivel,
      kmov: dto.kmov,
      ktiempo: dto.ktiempo,
      umbralEstrella1: dto.umbralEstrella1,
      umbralEstrella2: dto.umbralEstrella2,
      umbralEstrella3: dto.umbralEstrella3,
      limiteTiempo: dto.limiteTiempo,
    });

    await this.repositorioNivel.guardar(nivel);

    return {
      id: nivel.id,
      nombre: nivel.nombre,
      dificultad: nivel.dificultad,
      ancho: nivel.ancho,
      alto: nivel.alto,
      baseNivel: nivel.baseNivel,
      kmov: nivel.kmov,
      ktiempo: nivel.ktiempo,
      umbralEstrella1: nivel.umbralEstrella1,
      umbralEstrella2: nivel.umbralEstrella2,
      umbralEstrella3: nivel.umbralEstrella3,
      limiteTiempo: nivel.limiteTiempo,
    };
  }
}
