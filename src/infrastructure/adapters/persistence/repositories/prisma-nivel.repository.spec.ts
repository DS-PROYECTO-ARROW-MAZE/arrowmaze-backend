import { PrismaNivelRepository } from './prisma-nivel.repository';
import { Nivel } from '../../../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../../../domain/value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../../../../domain/value-objects/celda';
import { Direccion } from '../../../../domain/value-objects/direccion';
import { Posicion } from '../../../../domain/value-objects/posicion';

describe('PrismaNivelRepository', () => {
  let repository: PrismaNivelRepository;
  let mockCreate: jest.Mock;
  let mockFindUnique: jest.Mock;

  const celdasSolvable = [
    [
      FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
      FabricaCeldasEstandar.crearVacia(),
    ],
  ];
  const definicion = DefinicionTablero.crear(2, 1, celdasSolvable);
  const nivel = Nivel.crear({
    id: 'nivel-test',
    nombre: 'Test',
    dificultad: 'FACIL',
    definicionTablero: definicion,
    ancho: 2,
    alto: 1,
    baseNivel: 1000,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
  });

  beforeEach(() => {
    mockCreate = jest.fn();
    mockFindUnique = jest.fn();

    const mockPrismaService = {
      nivel: {
        create: mockCreate,
        findUnique: mockFindUnique,
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    repository = new PrismaNivelRepository(mockPrismaService as any);
  });

  it('should_persist_the_nivel_using_a_Prisma_nested_write_when_guardar_is_called', async () => {
    mockCreate.mockResolvedValue(undefined);

    await repository.guardar(nivel);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg.data.id).toBe(nivel.id);
    expect(callArg.data.nombre).toBe('Test');
    expect(callArg.data.celdas).toBeDefined();
    expect(callArg.data.celdas.create).toHaveLength(2);
  });

  it('should_return_null_when_obtenerPorId_finds_no_nivel', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await repository.obtenerPorId('non-existent');
    expect(result).toBeNull();
  });

  it('should_return_a_Nivel_domain_object_when_obtenerPorId_finds_a_row', async () => {
    const prismaRow = {
      id: nivel.id,
      nombre: 'Test',
      dificultad: 'FACIL',
      ancho: 1,
      alto: 1,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
      limiteTiempo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      celdas: [
        {
          id: 'celda-1',
          nivelId: nivel.id,
          x: 0,
          y: 0,
          tipo: 'flecha',
          direccion: 'DERECHA',
        },
      ],
    };

    mockFindUnique.mockResolvedValue(prismaRow);

    const result = await repository.obtenerPorId(nivel.id);
    expect(result).toBeInstanceOf(Nivel);
    expect(result!.id).toBe(nivel.id);
    expect(result!.nombre).toBe('Test');
    expect(result!.definicionTablero.celdaEn(new Posicion(0, 0)).tipo).toBe(
      'flecha',
    );
  });

  it('should_round_trip_a_sparse_shaped_board_without_inventing_filler_cells', async () => {
    // A shaped board: only (0,0) and (1,1) are playable; the other two bounding-box
    // positions are absent and must persist as the absence of a row.
    const celdasShaped = [
      [
        FabricaCeldasEstandar.crearFlecha(Direccion.ABAJO),
        FabricaCeldasEstandar.crearAusente(),
      ],
      [
        FabricaCeldasEstandar.crearAusente(),
        FabricaCeldasEstandar.crearVacia(),
      ],
    ];
    const nivelShaped = Nivel.crear({
      ...nivel,
      definicionTablero: DefinicionTablero.restaurar(2, 2, celdasShaped),
      ancho: 2,
      alto: 2,
    });

    mockCreate.mockResolvedValue(undefined);
    await repository.guardar(nivelShaped);

    const persisted = mockCreate.mock.calls[0][0].data.celdas.create;
    // Only the two playable positions become rows — absent positions are skipped.
    expect(persisted).toHaveLength(2);
    expect(persisted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x: 0, y: 0, tipo: 'flecha' }),
        expect.objectContaining({ x: 1, y: 1, tipo: 'vacia' }),
      ]),
    );

    // Loading those sparse rows back reconstructs the mask: absent positions become 'ausente'.
    mockFindUnique.mockResolvedValue({
      id: nivelShaped.id,
      nombre: 'Test',
      dificultad: 'FACIL',
      ancho: 2,
      alto: 2,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
      limiteTiempo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      celdas: persisted.map(
        (
          c: { x: number; y: number; tipo: string; direccion: string | null },
          i: number,
        ) => ({
          id: `celda-${i}`,
          nivelId: nivelShaped.id,
          ...c,
        }),
      ),
    });

    const cargado = await repository.obtenerPorId(nivelShaped.id);
    expect(cargado!.definicionTablero.celdaEn(new Posicion(1, 0)).tipo).toBe(
      'ausente',
    );
    expect(cargado!.definicionTablero.celdaEn(new Posicion(0, 1)).tipo).toBe(
      'ausente',
    );
    expect(cargado!.definicionTablero.celdaEn(new Posicion(0, 0)).tipo).toBe(
      'flecha',
    );
    expect(cargado!.definicionTablero.celdaEn(new Posicion(1, 1)).tipo).toBe(
      'vacia',
    );
  });

  describe('profundo (depth axis)', () => {
    it('should_persist_profundo_and_the_z_coordinate_of_every_cell_when_guardar_is_called_on_a_3D_level', async () => {
      const nivel3D = Nivel.crear({
        ...nivel,
        definicionTablero: DefinicionTablero.restaurar(
          1,
          1,
          [
            [[FabricaCeldasEstandar.crearFlecha(Direccion.ADELANTE)]], // z=0
            [[FabricaCeldasEstandar.crearVacia()]], // z=1
          ],
          2,
        ),
        ancho: 1,
        alto: 1,
        profundo: 2,
      });

      mockCreate.mockResolvedValue(undefined);
      await repository.guardar(nivel3D);

      const data = mockCreate.mock.calls[0][0].data;
      expect(data.profundo).toBe(2);
      const persisted = data.celdas.create;
      expect(persisted).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: 0, y: 0, z: 0, tipo: 'flecha' }),
          expect.objectContaining({ x: 0, y: 0, z: 1, tipo: 'vacia' }),
        ]),
      );
    });

    it('should_reconstruct_the_same_3D_DefinicionTablero_when_obtenerPorId_finds_a_layered_row', async () => {
      mockFindUnique.mockResolvedValue({
        id: nivel.id,
        nombre: 'Test',
        dificultad: 'FACIL',
        ancho: 1,
        alto: 1,
        profundo: 2,
        baseNivel: 1000,
        kmov: 10,
        ktiempo: 5,
        umbralEstrella1: 800,
        umbralEstrella2: 600,
        umbralEstrella3: 400,
        limiteTiempo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        celdas: [
          {
            id: 'celda-1',
            nivelId: nivel.id,
            x: 0,
            y: 0,
            z: 0,
            tipo: 'flecha',
            direccion: 'ADELANTE',
          },
          {
            id: 'celda-2',
            nivelId: nivel.id,
            x: 0,
            y: 0,
            z: 1,
            tipo: 'vacia',
            direccion: null,
          },
        ],
      });

      const cargado = await repository.obtenerPorId(nivel.id);

      expect(cargado!.profundo).toBe(2);
      expect(
        cargado!.definicionTablero.celdaEn(new Posicion(0, 0, 0)).tipo,
      ).toBe('flecha');
      expect(
        cargado!.definicionTablero.celdaEn(new Posicion(0, 0, 1)).tipo,
      ).toBe('vacia');
    });

    it('should_default_profundo_to_1_and_z_to_0_when_a_2D_row_is_loaded_regression', async () => {
      mockFindUnique.mockResolvedValue({
        id: nivel.id,
        nombre: 'Test',
        dificultad: 'FACIL',
        ancho: 2,
        alto: 1,
        profundo: 1,
        baseNivel: 1000,
        kmov: 10,
        ktiempo: 5,
        umbralEstrella1: 800,
        umbralEstrella2: 600,
        umbralEstrella3: 400,
        limiteTiempo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        celdas: [
          {
            id: 'celda-1',
            nivelId: nivel.id,
            x: 0,
            y: 0,
            z: 0,
            tipo: 'flecha',
            direccion: 'DERECHA',
          },
          {
            id: 'celda-2',
            nivelId: nivel.id,
            x: 1,
            y: 0,
            z: 0,
            tipo: 'vacia',
            direccion: null,
          },
        ],
      });

      const cargado = await repository.obtenerPorId(nivel.id);

      expect(cargado!.profundo).toBe(1);
      expect(cargado!.definicionTablero.celdaEn(new Posicion(0, 0)).tipo).toBe(
        'flecha',
      );
    });
  });
});
