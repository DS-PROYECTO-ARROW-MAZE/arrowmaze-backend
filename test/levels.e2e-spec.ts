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

describe('Levels (e2e)', () => {
  let app: INestApplication<App>;
  let mockRepo: jest.Mocked<IRepositorioNivel>;

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
    ancho: 1,
    alto: 1,
    celdas: [[{ tipo: 'flecha', direccion: 'DERECHA' }]],
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

  it('POST /levels with solvable board returns 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/levels')
      .send(solvableBoard)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.nombre).toBe('Test Level');
    expect(mockRepo.guardar).toHaveBeenCalledTimes(1);
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
});
