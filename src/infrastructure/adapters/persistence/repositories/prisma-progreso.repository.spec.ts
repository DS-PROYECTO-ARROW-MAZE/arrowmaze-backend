import { PrismaProgresoRepository } from './prisma-progreso.repository';
import { Progreso } from '../../../../domain/entities/progreso';

describe('PrismaProgresoRepository', () => {
  let repository: PrismaProgresoRepository;
  let mockCreate: jest.Mock;
  let mockTransaction: jest.Mock;

  const progreso1 = Progreso.crear({
    id: 'progreso-1',
    jugadorId: 'jugador-1',
    nivelId: 'nivel-1',
    movimientos: 3,
    segundosRestantes: 10,
    puntaje: 900,
    estrellas: 3,
    completadoEn: new Date('2026-01-01T00:00:00.000Z'),
  });
  const progreso2 = Progreso.crear({
    id: 'progreso-2',
    jugadorId: 'jugador-1',
    nivelId: 'nivel-2',
    movimientos: 8,
    puntaje: 600,
    estrellas: 1,
    completadoEn: new Date('2026-01-02T00:00:00.000Z'),
  });

  beforeEach(() => {
    mockCreate = jest.fn((args) => ({ __prismaPromise: args }));
    mockTransaction = jest.fn().mockResolvedValue(undefined);

    const mockPrismaService = {
      progreso: { create: mockCreate },
      $transaction: mockTransaction,
    };

    repository = new PrismaProgresoRepository(mockPrismaService as any);
  });

  it('should_wrap_every_write_inside_a_single_transaction_call_when_saving_a_batch', async () => {
    // Act
    await repository.guardarLote([progreso1, progreso2]);

    // Assert — ADR-0003: the $transaction lives only inside this adapter.
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const escrituras = mockTransaction.mock.calls[0][0];
    expect(escrituras).toHaveLength(2);
  });

  it('should_map_each_progreso_to_a_prisma_create_call_with_the_recomputed_fields', async () => {
    // Act
    await repository.guardarLote([progreso1]);

    // Assert
    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg.data.id).toBe(progreso1.id);
    expect(callArg.data.movimientos).toBe(3);
    expect(callArg.data.segundosRestantes).toBe(10);
    expect(callArg.data.puntaje).toBe(900);
    expect(callArg.data.estrellas).toBe(3);
    expect(callArg.data.completadoEn).toEqual(progreso1.completadoEn);
  });

  it('should_propagate_the_failure_and_not_swallow_it_when_the_transaction_rejects_mid_batch', async () => {
    // Arrange — simulates a constraint violation at position k inside the batch.
    mockTransaction.mockRejectedValue(new Error('constraint violation'));

    // Act & Assert
    await expect(
      repository.guardarLote([progreso1, progreso2]),
    ).rejects.toThrow('constraint violation');
  });
});
