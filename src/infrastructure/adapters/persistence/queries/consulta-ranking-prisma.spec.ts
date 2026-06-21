import { ConsultaRankingPrisma } from './consulta-ranking-prisma';
import {
  EntradaRankingDto,
  RankingDto,
} from '../../../../application/dtos/ranking.dto';

describe('ConsultaRankingPrisma', () => {
  let consulta: ConsultaRankingPrisma;
  let mockFindMany: jest.Mock;

  const idNivel = '11111111-1111-1111-1111-111111111111';

  const filas: any[] = [
    {
      id: 'p1',
      puntaje: 900,
      estrellas: 3,
      movimientos: 1,
      segundosRestantes: 50,
      completadoEn: new Date('2026-06-01'),
      jugadorId: 'j1',
      jugador: { email: 'alice@test.com' },
      nivelId: idNivel,
    },
    {
      id: 'p2',
      puntaje: 750,
      estrellas: 2,
      movimientos: 5,
      segundosRestantes: 30,
      completadoEn: new Date('2026-06-02'),
      jugadorId: 'j2',
      jugador: { email: 'bob@test.com' },
      nivelId: idNivel,
    },
    {
      id: 'p3',
      puntaje: 600,
      estrellas: 1,
      movimientos: 10,
      segundosRestantes: 10,
      completadoEn: new Date('2026-06-03'),
      jugadorId: 'j3',
      jugador: { email: 'carol@test.com' },
      nivelId: idNivel,
    },
    {
      id: 'p4',
      puntaje: 450,
      estrellas: 1,
      movimientos: 15,
      segundosRestantes: null,
      completadoEn: new Date('2026-06-04'),
      jugadorId: 'j4',
      jugador: { email: 'dan@test.com' },
      nivelId: idNivel,
    },
  ];

  beforeEach(() => {
    mockFindMany = jest.fn().mockImplementation((args: any) => {
      const take = args?.take ?? filas.length;
      return Promise.resolve(filas.slice(0, take));
    });

    const mockPrismaService = {
      progreso: { findMany: mockFindMany },
    };

    consulta = new ConsultaRankingPrisma(mockPrismaService as any);
  });

  it('should_return_top_N_entries_ordered_by_puntaje_descending_when_obtenerTop_is_called', async () => {
    const result: RankingDto = await consulta.obtenerTop(idNivel, 3);

    expect(result.entradas).toHaveLength(3);
    expect(result.entradas[0].puntaje).toBe(900);
    expect(result.entradas[1].puntaje).toBe(750);
    expect(result.entradas[2].puntaje).toBe(600);
  });

  it('should_filter_by_nivelId_only_when_obtenerTop_is_called', async () => {
    await consulta.obtenerTop(idNivel, 10);

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.where.nivelId).toBe(idNivel);
  });

  it('should_limit_results_to_the_requested_limite_when_obtenerTop_is_called', async () => {
    await consulta.obtenerTop(idNivel, 2);

    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.take).toBe(2);
  });

  it('should_order_by_puntaje_descending_for_deterministic_tie_breaking_when_obtenerTop_is_called', async () => {
    await consulta.obtenerTop(idNivel, 10);

    const callArg = mockFindMany.mock.calls[0][0];
    const orderBy = callArg.orderBy;
    expect(orderBy[0].puntaje).toBe('desc');
    expect(orderBy[1].completadoEn).toBe('asc');
  });

  it('should_include_jugador_email_in_each_entry_when_obtenerTop_is_called', async () => {
    const result: RankingDto = await consulta.obtenerTop(idNivel, 2);

    expect(result.entradas[0].email).toBe('alice@test.com');
    expect(result.entradas[1].email).toBe('bob@test.com');
  });

  it('should_return_empty_list_when_no_progreso_rows_exist_for_the_level', async () => {
    mockFindMany.mockResolvedValue([]);

    const result: RankingDto = await consulta.obtenerTop(idNivel, 10);

    expect(result.entradas).toEqual([]);
  });

  it('should_include_all_ranking_fields_in_each_entry_when_obtenerTop_is_called', async () => {
    const result: RankingDto = await consulta.obtenerTop(idNivel, 1);

    const entrada: EntradaRankingDto = result.entradas[0];
    expect(entrada.puntaje).toBe(900);
    expect(entrada.estrellas).toBe(3);
    expect(entrada.movimientos).toBe(1);
    expect(entrada.segundosRestantes).toBe(50);
    expect(entrada.completadoEn).toEqual(filas[0].completadoEn.toISOString());
  });
});
