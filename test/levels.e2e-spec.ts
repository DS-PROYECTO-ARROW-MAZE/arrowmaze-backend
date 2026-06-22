import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  NIVEL_REPOSITORY,
  IRepositorioNivel,
} from '../src/domain/repositories/nivel.repository.interface';
import { Nivel } from '../src/domain/aggregates/nivel';
import { DefinicionTablero } from '../src/domain/value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../src/domain/value-objects/celda';
import { Direccion } from '../src/domain/value-objects/direccion';
import { Posicion } from '../src/domain/value-objects/posicion';

describe('Levels (e2e)', () => {
  let app: INestApplication<App>;
  let mockRepo: jest.Mocked<IRepositorioNivel>;

  const idExistente = '00000000-0000-0000-0000-000000000001';

  const nivelExistente = Nivel.crear({
    id: idExistente,
    nombre: 'Nivel Original',
    dificultad: 'FACIL',
    definicionTablero: DefinicionTablero.restaurar(1, 1, [
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

  beforeEach(async () => {
    mockRepo = {
      guardar: jest.fn().mockResolvedValue(undefined),
      obtenerPorId: jest.fn().mockImplementation((id: string) => {
        if (id === idExistente) return Promise.resolve(nivelExistente);
        return Promise.resolve(null);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NIVEL_REPOSITORY)
      .useValue(mockRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const solvableBoard = {
    nombre: 'Test Level',
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

  const unsolvableBoard = {
    ...solvableBoard,
    ancho: 2,
    celdas: [
      [
        { tipo: 'flecha', direccion: 'DERECHA' },
        { tipo: 'flecha', direccion: 'IZQUIERDA' },
      ],
    ],
  };

  // Heart-shaped playable region: the corners/notch are absent and persist as no row.
  const shapedSolvableBoard = {
    ...solvableBoard,
    nombre: 'Heart Level',
    ancho: 3,
    alto: 3,
    celdas: [
      [{ tipo: 'vacia' }, { tipo: 'ausente' }, { tipo: 'vacia' }],
      [
        { tipo: 'vacia' },
        { tipo: 'flecha', direccion: 'ABAJO' },
        { tipo: 'vacia' },
      ],
      [{ tipo: 'ausente' }, { tipo: 'vacia' }, { tipo: 'ausente' }],
    ],
  };

  // Single-cell arrow: solvable (it exits immediately) but violates arrow-length >= 2.
  const singleCellArrowBoard = {
    ...solvableBoard,
    ancho: 1,
    alto: 1,
    celdas: [[{ tipo: 'flecha', direccion: 'DERECHA' }]],
  };

  // A timed level needs an ordinal >= 10 AND a limiteTiempo (PRD §3 rule table).
  const timedLevel10 = {
    ...solvableBoard,
    nombre: 'Timed Level 10',
    numero: 10,
    limiteTiempo: 90,
  };

  // numero >= 10 without a limiteTiempo violates the timed-by-ordinal rule.
  const untimedLevel12 = {
    ...solvableBoard,
    nombre: 'Untimed Level 12',
    numero: 12,
  };

  // numero 1-9 must not declare a limiteTiempo.
  const timedLevel3 = {
    ...solvableBoard,
    nombre: 'Timed Level 3',
    numero: 3,
    limiteTiempo: 60,
  };

  // Bonus level: time/score do not apply, so ordinal/timer rules are exempt.
  const bonusLevel = {
    ...solvableBoard,
    nombre: 'Bonus Level',
    numero: 5,
    esBonus: true,
    limiteTiempo: 30,
  };

  it('POST /levels with a numero>=10 level missing limiteTiempo returns 422', async () => {
    const res = await request(app.getHttpServer())
      .post('/levels')
      .send(untimedLevel12)
      .expect(422);

    expect(res.body.message).toContain('tiempo');
    expect(mockRepo.guardar).not.toHaveBeenCalled();
  });

  it('POST /levels with a numero 1-9 level carrying limiteTiempo returns 422', async () => {
    const res = await request(app.getHttpServer())
      .post('/levels')
      .send(timedLevel3)
      .expect(422);

    expect(res.body.message).toContain('tiempo');
    expect(mockRepo.guardar).not.toHaveBeenCalled();
  });

  it('POST /levels with a valid timed level 10 returns 201 and persists the ordinal', async () => {
    const res = await request(app.getHttpServer())
      .post('/levels')
      .send(timedLevel10)
      .expect(201);

    expect(res.body.numero).toBe(10);
    expect(res.body.limiteTiempo).toBe(90);
    expect(mockRepo.guardar).toHaveBeenCalledTimes(1);
    const nivelGuardado = mockRepo.guardar.mock.calls[0][0];
    expect(nivelGuardado.numero).toBe(10);
  });

  it('POST /levels with a bonus level returns 201, persists the flag, and is non-scoring', async () => {
    const res = await request(app.getHttpServer())
      .post('/levels')
      .send(bonusLevel)
      .expect(201);

    expect(res.body.esBonus).toBe(true);
    // Time does not apply to bonus levels, so the limiteTiempo is dropped.
    expect(res.body.limiteTiempo).toBeUndefined();
    expect(mockRepo.guardar).toHaveBeenCalledTimes(1);
    const nivelGuardado = mockRepo.guardar.mock.calls[0][0];
    expect(nivelGuardado.esBonus).toBe(true);
    expect(nivelGuardado.esPuntuable).toBe(false);
  });

  it('POST /levels with solvable board returns 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/levels')
      .send(solvableBoard)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.nombre).toBe('Test Level');
    expect(mockRepo.guardar).toHaveBeenCalledTimes(1);
  });

  it('POST /levels with a shaped (heart) solvable board returns 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/levels')
      .send(shapedSolvableBoard)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.nombre).toBe('Heart Level');
    expect(mockRepo.guardar).toHaveBeenCalledTimes(1);
    // The persisted aggregate keeps absent positions as the absence of cells, not filler.
    const nivelGuardado = mockRepo.guardar.mock.calls[0][0];
    expect(
      nivelGuardado.definicionTablero.celdaEn(new Posicion(1, 0)).tipo,
    ).toBe('ausente');
  });

  it('POST /levels with a single-cell arrow returns 422 and persists nothing', async () => {
    const res = await request(app.getHttpServer())
      .post('/levels')
      .send(singleCellArrowBoard)
      .expect(422);

    expect(res.body.message).toContain('longitud');
    expect(mockRepo.guardar).not.toHaveBeenCalled();
  });

  it('POST /levels with unsolvable board returns 422', async () => {
    const res = await request(app.getHttpServer())
      .post('/levels')
      .send(unsolvableBoard)
      .expect(422);

    expect(res.body.message).toContain('no es solvable');
    expect(mockRepo.guardar).not.toHaveBeenCalled();
  });

  it('POST /levels rejects invalid request body', async () => {
    await request(app.getHttpServer())
      .post('/levels')
      .send({ nombre: 'incomplete' })
      .expect(400);
  });

  it('PUT /levels/:id with unknown id returns 404', async () => {
    const res = await request(app.getHttpServer())
      .put('/levels/unknown-id')
      .send(solvableBoard)
      .expect(404);

    expect(res.body.message).toContain('no encontrado');
    expect(mockRepo.guardar).not.toHaveBeenCalled();
  });

  it('PUT /levels/:id with unsolvable board returns 422', async () => {
    const res = await request(app.getHttpServer())
      .put(`/levels/${idExistente}`)
      .send(unsolvableBoard)
      .expect(422);

    expect(res.body.message).toContain('no es solvable');
    expect(mockRepo.guardar).not.toHaveBeenCalled();
  });

  it('PUT /levels/:id with solvable board returns 200', async () => {
    const updatedBoard = {
      ...solvableBoard,
      nombre: 'Nivel Actualizado',
      dificultad: 'MEDIO',
      baseNivel: 2000,
    };

    const res = await request(app.getHttpServer())
      .put(`/levels/${idExistente}`)
      .send(updatedBoard)
      .expect(200);

    expect(res.body.id).toBe(idExistente);
    expect(res.body.nombre).toBe('Nivel Actualizado');
    expect(res.body.dificultad).toBe('MEDIO');
    expect(res.body.baseNivel).toBe(2000);
    expect(mockRepo.guardar).toHaveBeenCalledTimes(1);
    const nivelGuardado = mockRepo.guardar.mock.calls[0][0];
    expect(nivelGuardado.id).toBe(idExistente);
    expect(nivelGuardado.nombre).toBe('Nivel Actualizado');
  });

  it('PUT /levels/:id rejects invalid request body', async () => {
    await request(app.getHttpServer())
      .put(`/levels/${idExistente}`)
      .send({ nombre: 'incomplete' })
      .expect(400);
  });

  it('GET /levels/:id returns 200 with level DTO for existing id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/levels/${idExistente}`)
      .expect(200);

    expect(res.body.id).toBe(idExistente);
    expect(res.body.nombre).toBe('Nivel Original');
    expect(res.body.dificultad).toBe('FACIL');
    expect(res.body.ancho).toBe(1);
    expect(res.body.alto).toBe(1);
    expect(res.body.baseNivel).toBe(1000);
    expect(res.body.kmov).toBe(10);
    expect(res.body.ktiempo).toBe(5);
    expect(res.body.umbralEstrella1).toBe(800);
    expect(res.body.umbralEstrella2).toBe(600);
    expect(res.body.umbralEstrella3).toBe(400);
  });

  it('GET /levels/:id includes celdas in the response', async () => {
    const res = await request(app.getHttpServer())
      .get(`/levels/${idExistente}`)
      .expect(200);

    expect(res.body.celdas).toBeDefined();
    expect(Array.isArray(res.body.celdas)).toBe(true);
    expect(res.body.celdas[0][0]).toEqual({
      tipo: 'flecha',
      direccion: 'DERECHA',
    });
  });

  it('GET /levels/:id returns 404 for unknown id', async () => {
    const res = await request(app.getHttpServer())
      .get('/levels/unknown-id')
      .expect(404);

    expect(res.body.message).toContain('no encontrado');
  });
});
