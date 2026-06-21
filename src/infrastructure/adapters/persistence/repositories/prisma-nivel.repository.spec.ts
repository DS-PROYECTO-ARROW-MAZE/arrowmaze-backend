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
    [FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)],
  ];
  const definicion = DefinicionTablero.crear(1, 1, celdasSolvable);
  const nivel = Nivel.crear({
    id: 'nivel-test',
    nombre: 'Test',
    dificultad: 'FACIL',
    definicionTablero: definicion,
    ancho: 1,
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

  it('guardar persists the nivel using Prisma nested write', async () => {
    mockCreate.mockResolvedValue(undefined);

    await repository.guardar(nivel);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArg = mockCreate.mock.calls[0][0];
    expect(callArg.data.id).toBe(nivel.id);
    expect(callArg.data.nombre).toBe('Test');
    expect(callArg.data.celdas).toBeDefined();
    expect(callArg.data.celdas.create).toHaveLength(1);
  });

  it('obtenerPorId returns null when nivel does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await repository.obtenerPorId('non-existent');
    expect(result).toBeNull();
  });

  it('obtenerPorId returns a Nivel domain object', async () => {
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
});
