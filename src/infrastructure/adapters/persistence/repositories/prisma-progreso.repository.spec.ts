import { PrismaProgresoRepository } from './prisma-progreso.repository';
import { Progreso } from '../../../../domain/entities/progreso';

describe('PrismaProgresoRepository', () => {
  let repository: PrismaProgresoRepository;
  let mockFindUnique: jest.Mock;
  let mockCreate: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockTransaction: jest.Mock;

  const corrida = (puntaje: number, extra: Partial<Parameters<typeof Progreso.crear>[0]> = {}) =>
    Progreso.crear({
      id: `progreso-${puntaje}`,
      jugadorId: 'jugador-1',
      nivelId: 'nivel-1',
      movimientos: 3,
      segundosRestantes: 10,
      puntaje,
      estrellas: 3,
      completadoEn: new Date('2026-01-01T00:00:00.000Z'),
      ...extra,
    });

  // A stored Prisma row as the client would return it (camelCase mapped columns).
  const filaAlmacenada = (puntaje: number) => ({
    id: 'progreso-existente',
    jugadorId: 'jugador-1',
    nivelId: 'nivel-1',
    movimientos: 9,
    segundosRestantes: 0,
    puntaje,
    estrellas: 1,
    completadoEn: new Date('2025-12-01T00:00:00.000Z'),
    createdAt: new Date('2025-12-01T00:00:00.000Z'),
  });

  beforeEach(() => {
    mockFindUnique = jest.fn().mockResolvedValue(null);
    mockCreate = jest.fn().mockResolvedValue(undefined);
    mockUpdate = jest.fn().mockResolvedValue(undefined);

    const tx = {
      progreso: {
        findUnique: mockFindUnique,
        create: mockCreate,
        update: mockUpdate,
      },
    };
    // Interactive ($transaction(cb)) form: the comparison reads + conditionally writes
    // inside one transaction (ADR-0003), so the mock invokes the callback with a tx client.
    mockTransaction = jest.fn((cb) => cb(tx));

    const mockPrismaService = { $transaction: mockTransaction };
    repository = new PrismaProgresoRepository(mockPrismaService as any);
  });

  it('should_create_the_row_with_the_runs_values_when_no_best_exists_yet', async () => {
    // Arrange — first sync for (jugador, nivel): nothing stored.
    mockFindUnique.mockResolvedValue(null);

    // Act
    await repository.guardarLote([corrida(800)]);

    // Assert
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
    const data = mockCreate.mock.calls[0][0].data;
    expect(data.puntaje).toBe(800);
    expect(data.movimientos).toBe(3);
    expect(data.segundosRestantes).toBe(10);
    expect(data.estrellas).toBe(3);
  });

  it('should_update_every_scored_field_when_the_new_puntaje_is_strictly_higher', async () => {
    // Arrange — stored best of 800, new run re-scores to 850.
    mockFindUnique.mockResolvedValue(filaAlmacenada(800));

    // Act
    await repository.guardarLote([
      corrida(850, {
        movimientos: 2,
        segundosRestantes: 20,
        estrellas: 3,
        completadoEn: new Date('2026-02-02T00:00:00.000Z'),
      }),
    ]);

    // Assert
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const data = mockUpdate.mock.calls[0][0].data;
    expect(data.puntaje).toBe(850);
    expect(data.movimientos).toBe(2);
    expect(data.segundosRestantes).toBe(20);
    expect(data.estrellas).toBe(3);
    expect(data.completadoEn).toEqual(new Date('2026-02-02T00:00:00.000Z'));
  });

  it('should_leave_the_stored_best_untouched_when_the_new_puntaje_is_lower', async () => {
    // Arrange — stored best of 800, losing run re-scores to 780.
    mockFindUnique.mockResolvedValue(filaAlmacenada(800));

    // Act
    await repository.guardarLote([corrida(780)]);

    // Assert — no overwrite-to-worse.
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should_leave_the_stored_best_untouched_when_the_new_puntaje_ties_it', async () => {
    // Arrange — strictly-greater ⇒ a tie does not update.
    mockFindUnique.mockResolvedValue(filaAlmacenada(800));

    // Act
    await repository.guardarLote([corrida(800)]);

    // Assert
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should_keep_only_the_max_when_a_batch_holds_two_runs_of_the_same_level', async () => {
    // Arrange — first sync, two runs for the same (jugador, nivel) in one batch.
    mockFindUnique.mockResolvedValue(null);

    // Act
    await repository.guardarLote([corrida(600), corrida(900)]);

    // Assert — a single row is written carrying the max; no partial extra row.
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate.mock.calls[0][0].data.puntaje).toBe(900);
  });

  it('should_wrap_the_reads_and_writes_inside_a_single_transaction_call', async () => {
    // Act
    await repository.guardarLote([corrida(800)]);

    // Assert — ADR-0003: the $transaction lives only inside this adapter.
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('should_propagate_the_failure_and_not_swallow_it_when_the_transaction_rejects', async () => {
    // Arrange
    mockTransaction.mockRejectedValue(new Error('constraint violation'));

    // Act & Assert
    await expect(repository.guardarLote([corrida(800)])).rejects.toThrow(
      'constraint violation',
    );
  });
});
