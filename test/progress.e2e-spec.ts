import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/adapters/persistence/prisma/prisma.service';

describe('Progress (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let nivelId: string;

  const email = `progress-e2e-${randomUUID()}@arrowmaze.test`;
  const password = 'secreta123';
  const nombreNivel = `Nivel Progreso E2E ${randomUUID()}`;

  const solvableBoard = {
    nombre: nombreNivel,
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

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    prisma = moduleFixture.get(PrismaService);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    token = loginResponse.body.token as string;

    const levelResponse = await request(app.getHttpServer())
      .post('/levels')
      .send(solvableBoard)
      .expect(201);
    nivelId = levelResponse.body.id as string;
  });

  afterAll(async () => {
    await prisma.progreso.deleteMany({ where: { nivelId } });
    await prisma.celdaNivel.deleteMany({ where: { nivelId } });
    await prisma.nivel.deleteMany({ where: { id: nivelId } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('should_persist_the_batch_with_the_server_recomputed_score_when_syncing_a_valid_run', async () => {
    // Act — the request DTO has no puntaje/estrellas field at all (whitelist-validated):
    // the client cannot assert a score even if it tried; only the server's recomputation
    // via ticket 05 ends up persisted.
    const res = await request(app.getHttpServer())
      .post('/progress/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        progresos: [
          {
            nivelId,
            movimientos: 1,
            segundosRestantes: 0,
            completadoEn: new Date().toISOString(),
          },
        ],
      })
      .expect(201);

    // Assert
    expect(res.body.guardados).toBe(1);

    const rows = await prisma.progreso.findMany({ where: { nivelId } });
    expect(rows).toHaveLength(1);
    // baseNivel(1000) - movimientos(1) * kmov(10) = 990 (untimed: time term dropped).
    expect(rows[0].puntaje).toBe(990);
    expect(rows[0].estrellas).toBe(3);
  });

  it('should_persist_nothing_for_the_batch_when_one_run_references_an_unknown_level', async () => {
    // Arrange
    const idDesconocido = randomUUID();

    // Act
    await request(app.getHttpServer())
      .post('/progress/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        progresos: [
          {
            nivelId,
            movimientos: 2,
            segundosRestantes: 0,
            completadoEn: new Date().toISOString(),
          },
          {
            nivelId: idDesconocido,
            movimientos: 1,
            segundosRestantes: 0,
            completadoEn: new Date().toISOString(),
          },
        ],
      })
      .expect(404);

    // Assert — the valid run in the same batch must NOT have been persisted either.
    const rows = await prisma.progreso.findMany({
      where: { nivelId, movimientos: 2 },
    });
    expect(rows).toHaveLength(0);
  });

  it('should_return_401_when_syncing_without_a_token', async () => {
    await request(app.getHttpServer())
      .post('/progress/sync')
      .send({ progresos: [] })
      .expect(401);
  });

  it('should_reject_an_empty_batch_when_authenticated', async () => {
    await request(app.getHttpServer())
      .post('/progress/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({ progresos: [] })
      .expect(400);
  });
});
