import { readFileSync } from 'fs';
import { join } from 'path';
import { ObtenerProgresoCasoDeUso } from './obtener-progreso.use-case';
import { IRepositorioProgreso } from '../../domain/repositories/progreso.repository.interface';
import { Progreso } from '../../domain/entities/progreso';

describe('ObtenerProgresoCasoDeUso', () => {
  let useCase: ObtenerProgresoCasoDeUso;
  let repositorioProgreso: jest.Mocked<IRepositorioProgreso>;

  const jugadorId = 'jugador-1';

  const progresosMock = [
    Progreso.crear({
      id: 'progreso-1',
      jugadorId,
      nivelId: 'nivel-1',
      movimientos: 3,
      puntaje: 970,
      estrellas: 3,
      completadoEn: new Date('2026-01-01T00:00:00.000Z'),
      segundosRestantes: 120,
    }),
    Progreso.crear({
      id: 'progreso-2',
      jugadorId,
      nivelId: 'nivel-2',
      movimientos: 5,
      puntaje: 950,
      estrellas: 2,
      completadoEn: new Date('2026-01-02T00:00:00.000Z'),
    }),
  ];

  beforeEach(() => {
    repositorioProgreso = {
      guardarLote: jest.fn().mockResolvedValue(undefined),
      obtenerPorJugador: jest.fn(),
    };
    useCase = new ObtenerProgresoCasoDeUso(repositorioProgreso);
  });

  it('should_map_all_progress_entries_to_respuesta_dtos_when_the_player_has_progress', async () => {
    repositorioProgreso.obtenerPorJugador.mockResolvedValue(progresosMock);

    const result = await useCase.execute(jugadorId);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      nivelId: 'nivel-1',
      puntaje: 970,
      estrellas: 3,
      movimientos: 3,
      segundosRestantes: 120,
      completadoEn: progresosMock[0].completadoEn,
    });
    expect(result[1]).toEqual({
      nivelId: 'nivel-2',
      puntaje: 950,
      estrellas: 2,
      movimientos: 5,
      segundosRestantes: undefined,
      completadoEn: progresosMock[1].completadoEn,
    });
  });

  it('should_return_an_empty_array_and_never_throw_when_the_player_has_no_progress', async () => {
    repositorioProgreso.obtenerPorJugador.mockResolvedValue([]);

    const result = await useCase.execute(jugadorId);

    expect(result).toEqual([]);
  });

  it('should_not_mention_prisma_when_reading_its_own_source', () => {
    const source = readFileSync(
      join(__dirname, 'obtener-progreso.use-case.ts'),
      'utf-8',
    );
    expect(source).not.toMatch(/prisma/i);
    expect(source).not.toMatch(/\$transaction/);
  });
});
