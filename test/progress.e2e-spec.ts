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

  // Use a high ordinal so it does not collide with the seed catalogue (1-15) or stale rows
  // from a previous aborted run. Must pair with limiteTiempo so the timed-by-ordinal rule
  // does not reject it.
  const testBaseNumero = 9000;
  const testLimiteTiempo = 999;

  // A 2-cell solvable board: the single-cell arrow fixture this test used to carry now
  // violates the arrow-length>=2 rule (level-rules ticket) and 422s at creation, so the
  // sync flow it gates could never be exercised. Two cells keep the run scorable while
  // satisfying the rule; the score below depends only on baseNivel/kmov/movimientos.
  const solvableBoard = {
    nombre: nombreNivel,
    numero: testBaseNumero,
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
    limiteTiempo: testLimiteTiempo,
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
    // Timed (limiteTiempo=999): referencia = 1000 + 999*5 = 5995, so 990/5995 ≈ 0.165 < 2/3 → 1★.
    expect(rows[0].estrellas).toBe(1);
  });

  it('should_reject_with_400_and_persist_nothing_when_the_batch_uses_the_legacy_client_field_names', async () => {
    // Regression (ticket 12): the Flutter client used to post elapsed-time `tiempoSegundos`
    // plus a client-claimed `estrellas`. Neither is on the canonical contract — the server
    // owns time as `segundosRestantes` and recomputes stars — so `forbidNonWhitelisted` must
    // reject them LOUDLY with a 400. A silent drop is exactly how real gameplay went missing
    // from Supabase, so this asserts the run is rejected AND nothing is written.
    const movimientosCentinela = 999;

    await request(app.getHttpServer())
      .post('/progress/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        progresos: [
          {
            nivelId,
            estrellas: 3,
            movimientos: movimientosCentinela,
            tiempoSegundos: 35,
            completadoEn: new Date().toISOString(),
          },
        ],
      })
      .expect(400);

    const rows = await prisma.progreso.findMany({
      where: { nivelId, movimientos: movimientosCentinela },
    });
    expect(rows).toHaveLength(0);
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

  it('should_return_401_when_getting_progress_without_a_token', async () => {
    await request(app.getHttpServer()).get('/progress').expect(401);
  });

  it('should_return_empty_array_when_the_player_has_no_progress', async () => {
    const noopEmail = `noop-progress-${randomUUID()}@arrowmaze.test`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: noopEmail, password })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: noopEmail, password })
      .expect(200);
    const noopToken = loginRes.body.token as string;

    const res = await request(app.getHttpServer())
      .get('/progress')
      .set('Authorization', `Bearer ${noopToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('should_return_best_per_level_when_the_player_has_progress', async () => {
    const res = await request(app.getHttpServer())
      .get('/progress')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    for (const entrada of res.body) {
      expect(entrada).toHaveProperty('nivelId');
      expect(entrada).toHaveProperty('puntaje');
      expect(entrada).toHaveProperty('estrellas');
      expect(entrada).toHaveProperty('movimientos');
      expect(entrada).toHaveProperty('completadoEn');
      expect(typeof entrada.puntaje).toBe('number');
      expect(typeof entrada.estrellas).toBe('number');
      expect(typeof entrada.movimientos).toBe('number');
    }
  });

  it('should_never_surface_worse_or_equal_runs_when_a_higher_score_exists', async () => {
    // Arrange — create a fresh level to guarantee no pre-existing progress.
    const hsNombre = `hs-progress-${randomUUID()}`;
    const hsLevelRes = await request(app.getHttpServer())
      .post('/levels')
      .send({
        nombre: hsNombre,
        numero: testBaseNumero + 1,
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
        limiteTiempo: testLimiteTiempo,
      })
      .expect(201);
    const hsNivelId = hsLevelRes.body.id as string;

    // Act — sync a best run (puntaje = 1000 - 10*10 = 900), then a worse run (puntaje = 800),
    // then a better run (puntaje = 950).
    await request(app.getHttpServer())
      .post('/progress/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        progresos: [
          {
            nivelId: hsNivelId,
            movimientos: 10,
            segundosRestantes: 0,
            completadoEn: new Date(Date.now() - 60000).toISOString(),
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/progress/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        progresos: [
          {
            nivelId: hsNivelId,
            movimientos: 20,
            segundosRestantes: 0,
            completadoEn: new Date().toISOString(),
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/progress/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        progresos: [
          {
            nivelId: hsNivelId,
            movimientos: 5,
            segundosRestantes: 0,
            completadoEn: new Date().toISOString(),
          },
        ],
      })
      .expect(201);

    // Assert — only the best row (puntaje 950) surfaces.
    const res = await request(app.getHttpServer())
      .get('/progress')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const nivelEntry = (
      res.body as Array<{ nivelId: string; puntaje: number }>
    ).find((e: { nivelId: string }) => e.nivelId === hsNivelId);
    expect(nivelEntry).toBeDefined();
    expect(nivelEntry!.puntaje).toBe(950);

    // Cleanup
    await prisma.progreso.deleteMany({ where: { nivelId: hsNivelId } });
    await prisma.celdaNivel.deleteMany({ where: { nivelId: hsNivelId } });
    await prisma.nivel.deleteMany({ where: { id: hsNivelId } });
  });

  it('should_surface_synced_gameplay_rows_in_the_leaderboard_ordered_by_puntaje', async () => {
    // Closes the loop the ticket is really about: rows written by /progress/sync must be
    // readable through the real (un-mocked) ranking projection. This level is created fresh
    // per run, so every leaderboard entry here is gameplay-originated — never Postman seed.
    await request(app.getHttpServer())
      .post('/progress/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        progresos: [
          {
            nivelId,
            movimientos: 0,
            segundosRestantes: 0,
            completadoEn: new Date().toISOString(),
          },
          {
            nivelId,
            movimientos: 5,
            segundosRestantes: 0,
            completadoEn: new Date().toISOString(),
          },
        ],
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/leaderboard?idNivel=${nivelId}&limite=10`)
      .expect(200);

    const entradas = res.body.entradas as Array<{
      puntaje: number;
      email: string;
    }>;

    // Every returned entry is this player's synced gameplay — proof the projection joins the
    // synced rows rather than returning an empty/seed-only board.
    expect(entradas.length).toBeGreaterThanOrEqual(2);
    expect(entradas.every((entrada) => entrada.email === email)).toBe(true);
    // baseNivel(1000) - movimientos(0) * kmov(10) = 1000 is the best run and must lead.
    expect(entradas[0].puntaje).toBe(1000);
    const puntajes = entradas.map((entrada) => entrada.puntaje);
    expect(puntajes).toEqual([...puntajes].sort((a, b) => b - a));
  });
});
