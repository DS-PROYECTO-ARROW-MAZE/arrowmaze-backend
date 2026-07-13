import { CrearNivelCasoDeUso } from './crear-nivel.use-case';
import { IRepositorioNivel } from '../../domain/repositories/nivel.repository.interface';
import { CrearNivelDto } from '../dtos/crear-nivel.dto';
import { Nivel } from '../../domain/aggregates/nivel';
import { Posicion } from '../../domain/value-objects/posicion';
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

  it('should_create_and_persist_a_level_when_the_board_is_solvable', async () => {
    const resultado = await useCase.execute(dtoValido);

    expect(resultado.id).toBeDefined();
    expect(resultado.nombre).toBe('Mi Nivel');
    expect(resultado.dificultad).toBe('FACIL');
    expect(repo.guardar).toHaveBeenCalledTimes(1);
    const nivelGuardado = repo.guardar.mock.calls[0][0];
    expect(nivelGuardado).toBeInstanceOf(Nivel);
    expect(nivelGuardado.nombre).toBe('Mi Nivel');
  });

  it('should_reject_the_board_and_not_call_guardar_when_the_board_is_unsolvable', async () => {
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

  it('should_create_a_timed_level_when_limiteTiempo_is_provided', async () => {
    const dtoConTiempo: CrearNivelDto = {
      ...dtoValido,
      limiteTiempo: 60,
    };

    const resultado = await useCase.execute(dtoConTiempo);
    expect(resultado.limiteTiempo).toBe(60);
  });

  it('should_create_an_untimed_level_when_limiteTiempo_is_omitted', async () => {
    const resultado = await useCase.execute(dtoValido);
    expect(resultado.limiteTiempo).toBeUndefined();
  });

  it('should_map_all_cell_types_when_the_board_mixes_flecha_pared_vacia_and_coleccionable', async () => {
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

  describe('profundo (depth axis)', () => {
    // z-axis analogue of dtoValido: a single arrow travels one cell forward in depth
    // before exiting the stack (the golden minimalSolvable3D fixture, in DTO shape).
    const dto3DSolvable: CrearNivelDto = {
      nombre: 'Nivel 3D',
      dificultad: 'FACIL',
      ancho: 1,
      alto: 1,
      profundo: 2,
      celdas: [
        [[{ tipo: 'flecha', direccion: 'ADELANTE' }]], // z=0
        [[{ tipo: 'vacia' }]], // z=1
      ],
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
    };

    it('should_create_and_persist_a_3D_level_when_the_stack_is_solvable', async () => {
      const resultado = await useCase.execute(dto3DSolvable);

      expect(resultado.profundo).toBe(2);
      expect(repo.guardar).toHaveBeenCalledTimes(1);
      const nivelGuardado = repo.guardar.mock.calls[0][0];
      expect(nivelGuardado.profundo).toBe(2);
      expect(
        nivelGuardado.definicionTablero.celdaEn(new Posicion(0, 0, 1)).tipo,
      ).toBe('vacia');
    });

    it('should_reject_the_stack_and_not_call_guardar_when_two_arrows_block_each_other_across_layers', async () => {
      // The golden depthAxisUnsolvable3D fixture, in DTO shape: two single-cell arrows
      // pointing at each other along the depth axis block each other forever.
      const dto3DUnsolvable: CrearNivelDto = {
        ...dto3DSolvable,
        celdas: [
          [[{ tipo: 'flecha', direccion: 'ADELANTE' }]], // z=0
          [[{ tipo: 'flecha', direccion: 'ATRAS' }]], // z=1
        ],
      };

      await expect(useCase.execute(dto3DUnsolvable)).rejects.toThrow();
      expect(repo.guardar).not.toHaveBeenCalled();
    });
  });
});
