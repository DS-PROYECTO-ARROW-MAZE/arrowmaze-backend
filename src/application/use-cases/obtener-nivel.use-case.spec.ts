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

  it('should throw NivelNoEncontradoException when id is unknown', async () => {
    repo.obtenerPorId.mockResolvedValue(null);

    await expect(useCase.execute('unknown-id')).rejects.toThrow(
      NivelNoEncontradoException,
    );
  });

  it('should return level dto when level is found and solvable', async () => {
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

  it('should include celdas in the response dto', async () => {
    repo.obtenerPorId.mockResolvedValue(nivelSolvable);

    const resultado = await useCase.execute(nivelSolvable.id);

    expect(resultado.celdas).toEqual([
      [{ tipo: 'flecha', direccion: 'DERECHA' }],
    ]);
  });

  it('should throw NivelNoSolvableException when a stored-but-now-unsolvable board is found (corruption)', async () => {
    repo.obtenerPorId.mockResolvedValue(nivelCorrupto);

    await expect(useCase.execute(nivelCorrupto.id)).rejects.toThrow(
      NivelNoSolvableException,
    );
  });

  it('should re-validate solvability before returning the level', async () => {
    const obtenerSpy = jest.spyOn(repo, 'obtenerPorId');
    repo.obtenerPorId.mockResolvedValue(nivelSolvable);

    await useCase.execute(nivelSolvable.id);

    expect(obtenerSpy).toHaveBeenCalledWith(nivelSolvable.id);
  });

  it('should return level with limiteTiempo when present', async () => {
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
});
