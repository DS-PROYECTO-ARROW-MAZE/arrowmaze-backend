import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  NIVEL_REPOSITORY,
  IRepositorioNivel,
} from '../src/domain/repositories/nivel.repository.interface';

describe('Levels (e2e)', () => {
  let app: INestApplication<App>;
  let mockRepo: jest.Mocked<IRepositorioNivel>;

  beforeEach(async () => {
    mockRepo = {
      guardar: jest.fn().mockResolvedValue(undefined),
      obtenerPorId: jest.fn(),
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
});
