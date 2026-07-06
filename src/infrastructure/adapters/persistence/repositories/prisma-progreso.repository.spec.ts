import { PrismaProgresoRepository } from './prisma-progreso.repository';
import { Progreso } from '../../../../domain/entities/progreso';

describe('PrismaProgresoRepository', () => {
  let repository: PrismaProgresoRepository;
  let mockFindMany: jest.Mock;
  let mockTransaction: jest.Mock;

  const jugadorId = 'jugador-1';
  const nivel1Id = 'nivel-1';
  const nivel2Id = 'nivel-2';

  const filas: any[] = [
    {
      id: 'progreso-1',
      jugadorId,
      nivelId: nivel1Id,
      movimientos: 3,
      segundosRestantes: 120,
      puntaje: 970,
      estrellas: 3,
      completadoEn: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      id: 'progreso-2',
      jugadorId,
      nivelId: nivel2Id,
      movimientos: 5,
      segundosRestantes: null,
      puntaje: 950,
      estrellas: 2,
      completadoEn: new Date('2026-01-02T00:00:00.000Z'),
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    },
  ];

  beforeEach(() => {
    mockFindMany = jest.fn().mockResolvedValue(filas);
    mockTransaction = jest.fn();

    const mockPrismaService = {
      progreso: { findMany: mockFindMany },
      $transaction: mockTransaction,
    };

    repository = new PrismaProgresoRepository(mockPrismaService as any);
  });

  it('should_filter_by_jugadorId_when_obtenerPorJugador_is_called', async () => {
    await repository.obtenerPorJugador(jugadorId);

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.where.jugadorId).toBe(jugadorId);
  });

  it('should_order_by_nivel_numero_ascending_for_deterministic_order_when_obtenerPorJugador_is_called', async () => {
    await repository.obtenerPorJugador(jugadorId);

    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.orderBy).toEqual({ nivel: { numero: 'asc' } });
  });

  it('should_map_each_row_to_a_domain_Progreso_entity_when_obtenerPorJugador_is_called', async () => {
    const result: Progreso[] = await repository.obtenerPorJugador(jugadorId);

    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(Progreso);
    expect(result[0].jugadorId).toBe(jugadorId);
    expect(result[0].nivelId).toBe(nivel1Id);
    expect(result[0].puntaje).toBe(970);
    expect(result[0].segundosRestantes).toBe(120);
    expect(result[1]).toBeInstanceOf(Progreso);
    expect(result[1].nivelId).toBe(nivel2Id);
    expect(result[1].puntaje).toBe(950);
    expect(result[1].segundosRestantes).toBeUndefined();
  });

  it('should_return_an_empty_array_when_no_progress_exists_for_the_jugador', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await repository.obtenerPorJugador(jugadorId);

    expect(result).toEqual([]);
  });
});
