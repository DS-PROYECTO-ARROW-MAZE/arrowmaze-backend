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

export function mapearCeldasDesdeDto(celdasDto: CeldaDto[][]): Celda[][] {
  return celdasDto.map((fila) =>
    fila.map((celdaDto) => {
      switch (celdaDto.tipo) {
        case 'flecha':
          return FabricaCeldasEstandar.crearFlecha(
            celdaDto.direccion as Direccion,
          );
        case 'pared':
          return FabricaCeldasEstandar.crearPared();
        case 'vacia':
          return FabricaCeldasEstandar.crearVacia();
        case 'coleccionable':
          return FabricaCeldasEstandar.crearColeccionable();
        case 'ausente':
          return FabricaCeldasEstandar.crearAusente();
      }
    }),
  );
}
