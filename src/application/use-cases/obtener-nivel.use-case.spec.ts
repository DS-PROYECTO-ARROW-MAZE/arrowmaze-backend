import { ObtenerNivelCasoDeUso } from './obtener-nivel.use-case';
import { IRepositorioNivel } from '../../domain/repositories/nivel.repository.interface';
import { NivelNoEncontradoException } from '../../domain/exceptions/nivel-no-encontrado.exception';
import { NivelNoSolvableException } from '../../domain/exceptions/nivel-no-solvable.exception';
import { Nivel } from '../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../domain/value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../../domain/value-objects/celda';
import { Direccion } from '../../domain/value-objects/direccion';

describe('ObtenerNivelCasoDeUso', () => {
  let useCase: ObtenerNivelCasoDeUso;
  let repo: jest.Mocked<IRepositorioNivel>;

  const nivelSolvable = Nivel.crear({
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Nivel Solvable',
    dificultad: 'FACIL',
    definicionTablero: DefinicionTablero.restaurar(1, 1, [
      [FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)],
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

  const nivelCorrupto = Nivel.crear({
    id: '00000000-0000-0000-0000-000000000002',
    nombre: 'Nivel Corrupto',
    dificultad: 'FACIL',
    definicionTablero: DefinicionTablero.restaurar(2, 1, [
      [
        FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
        FabricaCeldasEstandar.crearFlecha(Direccion.IZQUIERDA),
      ],
    ]),
    ancho: 2,
    alto: 1,
    baseNivel: 1000,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
  });

  beforeEach((): void => {
    repo = {
      guardar: jest.fn<Promise<void>, [Nivel]>(),
      obtenerPorId: jest.fn<Promise<Nivel | null>, [string]>(),
    };
    useCase = new ObtenerNivelCasoDeUso(repo);
  });

  it('should_throw_NivelNoEncontradoException_when_id_is_unknown', async () => {
    repo.obtenerPorId.mockResolvedValue(null);

    await expect(useCase.execute('unknown-id')).rejects.toThrow(
      NivelNoEncontradoException,
    );
  });

  it('should_return_level_dto_when_level_is_found_and_solvable', async () => {
    repo.obtenerPorId.mockResolvedValue(nivelSolvable);

    const resultado = await useCase.execute(nivelSolvable.id);

    expect(resultado.id).toBe(nivelSolvable.id);
    expect(resultado.nombre).toBe('Nivel Solvable');
    expect(resultado.dificultad).toBe('FACIL');
    expect(resultado.ancho).toBe(1);
    expect(resultado.alto).toBe(1);
    expect(resultado.baseNivel).toBe(1000);
    expect(resultado.kmov).toBe(10);
    expect(resultado.ktiempo).toBe(5);
    expect(resultado.umbralEstrella1).toBe(800);
    expect(resultado.umbralEstrella2).toBe(600);
    expect(resultado.umbralEstrella3).toBe(400);
    expect(resultado.limiteTiempo).toBeUndefined();
  });

  it('should_include_celdas_in_the_response_dto_when_level_is_found', async () => {
    repo.obtenerPorId.mockResolvedValue(nivelSolvable);

    const resultado = await useCase.execute(nivelSolvable.id);

    expect(resultado.celdas).toEqual([
      [{ tipo: 'flecha', direccion: 'DERECHA' }],
    ]);
  });

  it('should_throw_NivelNoSolvableException_when_a_stored_but_now_unsolvable_board_is_found', async () => {
    repo.obtenerPorId.mockResolvedValue(nivelCorrupto);

    await expect(useCase.execute(nivelCorrupto.id)).rejects.toThrow(
      NivelNoSolvableException,
    );
  });

  it('should_re_validate_solvability_when_returning_the_level', async () => {
    const obtenerSpy = jest.spyOn(repo, 'obtenerPorId');
    repo.obtenerPorId.mockResolvedValue(nivelSolvable);

    await useCase.execute(nivelSolvable.id);

    expect(obtenerSpy).toHaveBeenCalledWith(nivelSolvable.id);
  });

  it('should_return_level_with_limiteTiempo_when_present', async () => {
    const nivelConTiempo = Nivel.crear({
      id: '00000000-0000-0000-0000-000000000003',
      nombre: 'Nivel Con Tiempo',
      dificultad: 'DIFICIL',
      definicionTablero: DefinicionTablero.restaurar(1, 1, [
        [FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)],
      ]),
      ancho: 1,
      alto: 1,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
      limiteTiempo: 60,
    });
    repo.obtenerPorId.mockResolvedValue(nivelConTiempo);

    const resultado = await useCase.execute(nivelConTiempo.id);

    expect(resultado.limiteTiempo).toBe(60);
  });

  describe('profundo (depth axis)', () => {
    const nivel3D = Nivel.crear({
      id: '00000000-0000-0000-0000-000000000004',
      nombre: 'Nivel 3D',
      dificultad: 'FACIL',
      definicionTablero: DefinicionTablero.restaurar(
        1,
        1,
        [
          [[FabricaCeldasEstandar.crearFlecha(Direccion.ADELANTE)]], // z=0
          [[FabricaCeldasEstandar.crearVacia()]], // z=1
        ],
        2,
      ),
      ancho: 1,
      alto: 1,
      profundo: 2,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
    });

    it('should_return_the_same_profundo_and_layered_celdas_the_level_was_created_with', async () => {
      repo.obtenerPorId.mockResolvedValue(nivel3D);

      const resultado = await useCase.execute(nivel3D.id);

      expect(resultado.profundo).toBe(2);
      expect(resultado.celdas).toEqual([
        [[{ tipo: 'flecha', direccion: 'ADELANTE' }]],
        [[{ tipo: 'vacia' }]],
      ]);
    });
  });
});
