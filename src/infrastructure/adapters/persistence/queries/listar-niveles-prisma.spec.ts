import { ListarNivelesPrisma } from './listar-niveles-prisma';
import { NivelResumenDto } from '../../../../application/dtos/nivel-resumen.dto';

describe('ListarNivelesPrisma', () => {
  let consulta: ListarNivelesPrisma;
  let mockFindMany: jest.Mock;

  const filas: any[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      numero: 1,
      nombre: 'Nivel 1',
      dificultad: 'FACIL',
      esBonus: false,
      ancho: 3,
      alto: 3,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      numero: 2,
      nombre: 'Nivel 2',
      dificultad: 'FACIL',
      esBonus: true,
      ancho: 3,
      alto: 3,
    },
  ];

  beforeEach(() => {
    mockFindMany = jest.fn().mockResolvedValue(filas);
    const mockPrismaService = { nivel: { findMany: mockFindMany } };
    consulta = new ListarNivelesPrisma(mockPrismaService as any);
  });

  it('should_query_ordered_by_numero_ascending_when_listar_is_called', async () => {
    await consulta.listar();

    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.orderBy).toEqual({ numero: 'asc' });
  });

  it('should_project_only_summary_fields_and_exclude_board_cells', async () => {
    await consulta.listar();

    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.select).toEqual({
      id: true,
      numero: true,
      nombre: true,
      dificultad: true,
      esBonus: true,
      ancho: true,
      alto: true,
    });
    // The board cells must never be part of the catalog projection.
    expect(callArg.select.celdas).toBeUndefined();
    expect(callArg.include).toBeUndefined();
  });

  it('should_map_each_row_to_a_summary_dto', async () => {
    const result: NivelResumenDto[] = await consulta.listar();

    expect(result).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000001',
        numero: 1,
        nombre: 'Nivel 1',
        dificultad: 'FACIL',
        esBonus: false,
        ancho: 3,
        alto: 3,
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        numero: 2,
        nombre: 'Nivel 2',
        dificultad: 'FACIL',
        esBonus: true,
        ancho: 3,
        alto: 3,
      },
    ]);
    expect(
      (result[0] as unknown as Record<string, unknown>).celdas,
    ).toBeUndefined();
  });

  it('should_return_an_empty_list_when_no_levels_exist', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await consulta.listar();

    expect(result).toEqual([]);
  });
});
