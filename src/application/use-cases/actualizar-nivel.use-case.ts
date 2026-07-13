import { IRepositorioNivel } from '../../domain/repositories/nivel.repository.interface';
import { Nivel } from '../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../domain/value-objects/definicion-tablero';
import { FabricaCeldasEstandar, Celda } from '../../domain/value-objects/celda';
import { Direccion } from '../../domain/value-objects/direccion';
import { GrafoTablero } from '../../domain/services/grafo-tablero';
import { esSolvable } from '../../domain/services/solver';
import { NivelNoSolvableException } from '../../domain/exceptions/nivel-no-solvable.exception';
import { NivelNoEncontradoException } from '../../domain/exceptions/nivel-no-encontrado.exception';
import {
  ActualizarNivelDto,
  ActualizarNivelResultadoDto,
} from '../dtos/actualizar-nivel.dto';
import { CeldaDto } from '../dtos/crear-nivel.dto';

export class ActualizarNivelCasoDeUso {
  constructor(private readonly repositorioNivel: IRepositorioNivel) {}

  async execute(
    id: string,
    dto: ActualizarNivelDto,
  ): Promise<ActualizarNivelResultadoDto> {
    const nivelExistente = await this.repositorioNivel.obtenerPorId(id);
    if (!nivelExistente) {
      throw new NivelNoEncontradoException(id);
    }

    const celdas = mapearCeldasDesdeDto(dto.celdas);
    const tablero = new GrafoTablero(dto.ancho, dto.alto, celdas);
    if (!esSolvable(tablero)) {
      throw new NivelNoSolvableException();
    }

    const definicion = DefinicionTablero.crear(dto.ancho, dto.alto, celdas);
    const nivelActualizado = Nivel.crear({
      id,
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

    await this.repositorioNivel.guardar(nivelActualizado);

    return {
      id: nivelActualizado.id,
      nombre: nivelActualizado.nombre,
      dificultad: nivelActualizado.dificultad,
      ancho: nivelActualizado.ancho,
      alto: nivelActualizado.alto,
      baseNivel: nivelActualizado.baseNivel,
      kmov: nivelActualizado.kmov,
      ktiempo: nivelActualizado.ktiempo,
      umbralEstrella1: nivelActualizado.umbralEstrella1,
      umbralEstrella2: nivelActualizado.umbralEstrella2,
      umbralEstrella3: nivelActualizado.umbralEstrella3,
      limiteTiempo: nivelActualizado.limiteTiempo,
    };
  }
}

function mapearCelda(celdaDto: CeldaDto): Celda {
  switch (celdaDto.tipo) {
    case 'flecha':
      return FabricaCeldasEstandar.crearFlecha(celdaDto.direccion as Direccion);
    case 'pared':
      return FabricaCeldasEstandar.crearPared();
    case 'vacia':
      return FabricaCeldasEstandar.crearVacia();
    case 'coleccionable':
      return FabricaCeldasEstandar.crearColeccionable();
    case 'ausente':
      return FabricaCeldasEstandar.crearAusente();
  }
}

// Accepts either a single 2D layer (CeldaDto[][], the pre-ticket-19 shape) or an explicit
// stack of layers indexed [z][y][x] (3D boards) — mirrors domain/value-objects/celda.ts's
// capasDesde detection (a CeldaDto is never itself an array) so every existing 2D caller
// keeps passing a bare CeldaDto[][] unchanged.
export function mapearCeldasDesdeDto(
  celdasDto: CeldaDto[][] | CeldaDto[][][],
): Celda[][] | Celda[][][] {
  const primeraFila = celdasDto[0];
  const esApilado = Array.isArray(primeraFila) && Array.isArray(primeraFila[0]);

  if (esApilado) {
    return (celdasDto as CeldaDto[][][]).map((capa) =>
      capa.map((fila) => fila.map(mapearCelda)),
    );
  }
  return (celdasDto as CeldaDto[][]).map((fila) => fila.map(mapearCelda));
}
