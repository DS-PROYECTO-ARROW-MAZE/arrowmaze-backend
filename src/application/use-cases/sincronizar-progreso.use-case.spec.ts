import { readFileSync } from 'fs';
import { join } from 'path';
import { SincronizarProgresoCasoDeUso } from './sincronizar-progreso.use-case';
import { CalcularPuntuacionCasoDeUso } from './calcular-puntuacion.use-case';
import { IRepositorioProgreso } from '../../domain/repositories/progreso.repository.interface';
import { IRepositorioNivel } from '../../domain/repositories/nivel.repository.interface';
import { NivelNoEncontradoException } from '../../domain/exceptions/nivel-no-encontrado.exception';
import { Nivel } from '../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../domain/value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../../domain/value-objects/celda';
import { Direccion } from '../../domain/value-objects/direccion';
import { ResultadoPuntaje } from '../../domain/value-objects/resultado-puntaje';
import { Progreso } from '../../domain/entities/progreso';
import { SincronizarProgresoDto } from '../dtos/sincronizar-progreso.dto';
import { IGeneradorId } from '../ports/generador-id.port';

describe('SincronizarProgresoCasoDeUso', () => {
  let useCase: SincronizarProgresoCasoDeUso;
  let repositorioProgreso: jest.Mocked<IRepositorioProgreso>;
  let repositorioNivel: jest.Mocked<IRepositorioNivel>;
  let calculadora: CalcularPuntuacionCasoDeUso;

  const nivel = Nivel.crear({
    id: 'nivel-1',
    nombre: 'Nivel 1',
    dificultad: 'FACIL',
    definicionTablero: DefinicionTablero.crear(2, 1, [
      [
        FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
        FabricaCeldasEstandar.crearVacia(),
      ],
    ]),
    ancho: 1,
    alto: 1,
    baseNivel: 1000,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
  });

  const dtoValido: SincronizarProgresoDto = {
    jugadorId: 'jugador-1',
    progresos: [
      {
        nivelId: 'nivel-1',
        movimientos: 3,
        segundosRestantes: 10,
        completadoEn: '2026-01-01T00:00:00.000Z',
      },
      {
        nivelId: 'nivel-1',
        movimientos: 5,
        segundosRestantes: 0,
        completadoEn: '2026-01-02T00:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    repositorioProgreso = {
      guardarLote: jest.fn().mockResolvedValue(undefined),
    };
    repositorioNivel = {
      guardar: jest.fn(),
      obtenerPorId: jest.fn().mockResolvedValue(nivel),
    };
    calculadora = new CalcularPuntuacionCasoDeUso();
    let secuencia = 0;
    const generadorId: IGeneradorId = {
      generar: () => `progreso-generado-${++secuencia}`,
    };
    useCase = new SincronizarProgresoCasoDeUso(
      repositorioProgreso,
      repositorioNivel,
      calculadora,
      generadorId,
    );
  });

  it('should_persist_one_batch_via_a_single_guardarLote_call_when_syncing_N_runs', async () => {
    // Act
    await useCase.execute(dtoValido);

    // Assert
    expect(repositorioProgreso.guardarLote).toHaveBeenCalledTimes(1);
    const lote = repositorioProgreso.guardarLote.mock.calls[0][0];
    expect(lote).toHaveLength(2);
    expect(lote.every((progreso) => progreso instanceof Progreso)).toBe(true);
  });

  it('should_persist_the_recomputed_score_instead_of_any_client_asserted_value_when_syncing_a_run', async () => {
    // Arrange — the client cannot be trusted to self-report {puntaje, estrellas}; only the
    // backend recomputation (faked here) may end up in the persisted batch.
    jest
      .spyOn(calculadora, 'ejecutar')
      .mockReturnValue(ResultadoPuntaje.puntuado(777, 2));
    const dtoConUnaCorrida: SincronizarProgresoDto = {
      jugadorId: 'jugador-1',
      progresos: [dtoValido.progresos[0]],
    };

    // Act
    await useCase.execute(dtoConUnaCorrida);

    // Assert
    const lote = repositorioProgreso.guardarLote.mock.calls[0][0];
    expect(lote[0].puntaje).toBe(777);
    expect(lote[0].estrellas).toBe(2);
  });

  it('should_call_the_score_calculator_once_per_run_with_the_level_fetched_via_the_repository', async () => {
    // Arrange
    const ejecutarSpy = jest.spyOn(calculadora, 'ejecutar');

    // Act
    await useCase.execute(dtoValido);

    // Assert
    expect(repositorioNivel.obtenerPorId).toHaveBeenCalledWith('nivel-1');
    expect(ejecutarSpy).toHaveBeenCalledTimes(2);
    expect(ejecutarSpy).toHaveBeenCalledWith({
      nivel,
      movimientos: 3,
      segundosRestantes: 10,
    });
  });

  it('should_not_persist_a_progreso_when_the_run_is_non_scoring_bonus', async () => {
    // Arrange — a bonus level produces a non-scoring result (PRD §3); it must not be
    // persisted as progress. Here the only run is non-scoring, so the batch is empty.
    jest
      .spyOn(calculadora, 'ejecutar')
      .mockReturnValue(ResultadoPuntaje.noPuntuable());
    const dtoConUnaCorrida: SincronizarProgresoDto = {
      jugadorId: 'jugador-1',
      progresos: [dtoValido.progresos[0]],
    };

    // Act
    const resultado = await useCase.execute(dtoConUnaCorrida);

    // Assert
    expect(resultado.guardados).toBe(0);
    const lote = repositorioProgreso.guardarLote.mock.calls[0][0];
    expect(lote).toHaveLength(0);
  });

  it('should_throw_NivelNoEncontradoException_and_never_call_guardarLote_when_a_run_references_an_unknown_level', async () => {
    // Arrange
    repositorioNivel.obtenerPorId.mockResolvedValueOnce(null);

    // Act & Assert
    await expect(useCase.execute(dtoValido)).rejects.toBeInstanceOf(
      NivelNoEncontradoException,
    );
    expect(repositorioProgreso.guardarLote).not.toHaveBeenCalled();
  });

  it('should_not_mention_prisma_or_transaction_when_reading_its_own_source', () => {
    // Arrange
    const source = readFileSync(
      join(__dirname, 'sincronizar-progreso.use-case.ts'),
      'utf-8',
    );

    // Act & Assert — ADR-0003: the $transaction stays inside the adapter; the application
    // layer never names Prisma.
    expect(source).not.toMatch(/prisma/i);
    expect(source).not.toMatch(/\$transaction/);
  });
});
