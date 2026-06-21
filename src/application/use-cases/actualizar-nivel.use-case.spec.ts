import { ActualizarNivelCasoDeUso } from './actualizar-nivel.use-case';
import { IRepositorioNivel } from '../../domain/repositories/nivel.repository.interface';
import { Nivel } from '../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../domain/value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../../domain/value-objects/celda';
import { Direccion } from '../../domain/value-objects/direccion';
import { NivelNoEncontradoException } from '../../domain/exceptions/nivel-no-encontrado.exception';
import { NivelNoSolvableException } from '../../domain/exceptions/nivel-no-solvable.exception';
import { ActualizarNivelDto } from '../dtos/actualizar-nivel.dto';

describe('ActualizarNivelCasoDeUso', () => {
  let useCase: ActualizarNivelCasoDeUso;
  let repo: jest.Mocked<IRepositorioNivel>;

  const idExistente = '00000000-0000-0000-0000-000000000001';

  const nivelExistente = Nivel.crear({
    id: idExistente,
    nombre: 'Nivel Original',
    dificultad: 'FACIL',
    definicionTablero: DefinicionTablero.crear(1, 1, [
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

  const dtoValido: ActualizarNivelDto = {
    nombre: 'Nivel Actualizado',
    dificultad: 'MEDIO',
    ancho: 1,
    alto: 1,
    celdas: [[{ tipo: 'flecha', direccion: 'ARRIBA' }]],
    baseNivel: 2000,
    kmov: 20,
    ktiempo: 10,
    umbralEstrella1: 1800,
    umbralEstrella2: 1600,
    umbralEstrella3: 1400,
  };

  const dtoUnsolvable: ActualizarNivelDto = {
    ...dtoValido,
    ancho: 2,
    celdas: [
      [
        { tipo: 'flecha', direccion: 'DERECHA' },
        { tipo: 'flecha', direccion: 'IZQUIERDA' },
      ],
    ],
  };

  beforeEach(() => {
    repo = {
      guardar: jest.fn<Promise<void>, [Nivel]>().mockResolvedValue(undefined),
      obtenerPorId: jest
        .fn<Promise<Nivel | null>, [string]>()
        .mockResolvedValue(nivelExistente),
    };
    useCase = new ActualizarNivelCasoDeUso(repo);
  });

  it('should_throw_NivelNoEncontradoException_when_id_does_not_exist', async () => {
    repo.obtenerPorId.mockResolvedValueOnce(null);

    await expect(useCase.execute(idExistente, dtoValido)).rejects.toThrow(
      NivelNoEncontradoException,
    );
    expect(repo.guardar).not.toHaveBeenCalled();
  });

  it('should_reject_unsolvable_board_and_not_call_guardar', async () => {
    await expect(useCase.execute(idExistente, dtoUnsolvable)).rejects.toThrow(
      NivelNoSolvableException,
    );
    expect(repo.guardar).not.toHaveBeenCalled();
  });

  it('should_persist_and_return_updated_nivel_for_solvable_board', async () => {
    const resultado = await useCase.execute(idExistente, dtoValido);

    expect(resultado.id).toBe(idExistente);
    expect(resultado.nombre).toBe('Nivel Actualizado');
    expect(resultado.dificultad).toBe('MEDIO');
    expect(resultado.baseNivel).toBe(2000);
    expect(resultado.umbralEstrella1).toBe(1800);
    expect(repo.guardar).toHaveBeenCalledTimes(1);
    const nivelGuardado = repo.guardar.mock.calls[0][0];
    expect(nivelGuardado).toBeInstanceOf(Nivel);
    expect(nivelGuardado.id).toBe(idExistente);
    expect(nivelGuardado.nombre).toBe('Nivel Actualizado');
  });

  it('should_update_with_limiteTiempo', async () => {
    const dtoConTiempo: ActualizarNivelDto = {
      ...dtoValido,
      limiteTiempo: 60,
    };

    const resultado = await useCase.execute(idExistente, dtoConTiempo);
    expect(resultado.limiteTiempo).toBe(60);
  });

  it('should_update_without_limiteTiempo', async () => {
    const resultado = await useCase.execute(idExistente, dtoValido);
    expect(resultado.limiteTiempo).toBeUndefined();
  });
});
