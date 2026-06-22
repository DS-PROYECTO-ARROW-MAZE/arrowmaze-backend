import { CrearNivelCasoDeUso } from './crear-nivel.use-case';
import { IRepositorioNivel } from '../../domain/repositories/nivel.repository.interface';
import { CrearNivelDto } from '../dtos/crear-nivel.dto';
import { Nivel } from '../../domain/aggregates/nivel';
import { IGeneradorId } from '../ports/generador-id.port';

describe('CrearNivelCasoDeUso', () => {
  let useCase: CrearNivelCasoDeUso;
  let repo: jest.Mocked<IRepositorioNivel>;

  const dtoValido: CrearNivelDto = {
    nombre: 'Mi Nivel',
    dificultad: 'FACIL',
    ancho: 2,
    alto: 1,
    celdas: [[{ tipo: 'flecha', direccion: 'DERECHA' }, { tipo: 'vacia' }]],
    baseNivel: 1000,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
  };

  beforeEach((): void => {
    repo = {
      guardar: jest.fn<Promise<void>, [Nivel]>().mockResolvedValue(undefined),
      obtenerPorId: jest.fn<Promise<Nivel | null>, [string]>(),
    };
    const generadorId: IGeneradorId = { generar: () => 'nivel-generado-1' };
    useCase = new CrearNivelCasoDeUso(repo, generadorId);
  });

  it('creates a level and persists it for a solvable board', async () => {
    const resultado = await useCase.execute(dtoValido);

    expect(resultado.id).toBeDefined();
    expect(resultado.nombre).toBe('Mi Nivel');
    expect(resultado.dificultad).toBe('FACIL');
    expect(repo.guardar).toHaveBeenCalledTimes(1);
    const nivelGuardado = repo.guardar.mock.calls[0][0];
    expect(nivelGuardado).toBeInstanceOf(Nivel);
    expect(nivelGuardado.nombre).toBe('Mi Nivel');
  });

  it('rejects an unsolvable board and does NOT call guardar', async () => {
    const dtoInvalido: CrearNivelDto = {
      ...dtoValido,
      ancho: 2,
      celdas: [
        [
          { tipo: 'flecha', direccion: 'DERECHA' },
          { tipo: 'flecha', direccion: 'IZQUIERDA' },
        ],
      ],
    };

    await expect(useCase.execute(dtoInvalido)).rejects.toThrow();
    expect(repo.guardar).not.toHaveBeenCalled();
  });

  it('creates a timed level with limiteTiempo', async () => {
    const dtoConTiempo: CrearNivelDto = {
      ...dtoValido,
      limiteTiempo: 60,
    };

    const resultado = await useCase.execute(dtoConTiempo);
    expect(resultado.limiteTiempo).toBe(60);
  });

  it('creates a level without limiteTiempo', async () => {
    const resultado = await useCase.execute(dtoValido);
    expect(resultado.limiteTiempo).toBeUndefined();
  });

  it('maps all cell types (flecha, pared, vacia, coleccionable)', async () => {
    const dtoVariado: CrearNivelDto = {
      ...dtoValido,
      ancho: 4,
      alto: 2,
      celdas: [
        [
          { tipo: 'pared' },
          { tipo: 'vacia' },
          { tipo: 'coleccionable' },
          { tipo: 'flecha', direccion: 'ABAJO' },
        ],
        [
          { tipo: 'vacia' },
          { tipo: 'vacia' },
          { tipo: 'vacia' },
          { tipo: 'vacia' },
        ],
      ],
    };

    const resultado = await useCase.execute(dtoVariado);
    expect(resultado.id).toBeDefined();
    expect(repo.guardar).toHaveBeenCalledTimes(1);
  });
});
