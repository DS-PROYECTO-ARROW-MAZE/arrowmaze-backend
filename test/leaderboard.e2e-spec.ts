import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  I_CONSULTA_RANKING,
  IConsultaRanking,
} from '../src/application/ports/consulta-ranking.port';

describe('Leaderboard (e2e)', () => {
  let app: INestApplication<App>;
  let mockConsultaRanking: jest.Mocked<IConsultaRanking>;

  beforeEach(async () => {
    mockConsultaRanking = {
      obtenerTop: jest.fn().mockResolvedValue({
        entradas: [
          {
            puntaje: 900,
            estrellas: 3,
            movimientos: 1,
            segundosRestantes: 50,
            completadoEn: new Date('2026-06-01').toISOString(),
            email: 'alice@test.com',
          },
          {
            puntaje: 750,
            estrellas: 2,
            movimientos: 5,
            segundosRestantes: 30,
            completadoEn: new Date('2026-06-02').toISOString(),
            email: 'bob@test.com',
          },
          {
            puntaje: 600,
            estrellas: 1,
            movimientos: 10,
            segundosRestantes: null,
            completadoEn: new Date('2026-06-03').toISOString(),
            email: 'carol@test.com',
          },
        ],
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(I_CONSULTA_RANKING)
      .useValue(mockConsultaRanking)
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

  const NIVEL_ID = '11111111-1111-4111-a111-111111111111';
  const OTRO_NIVEL_ID = '22222222-2222-4222-b222-222222222222';

  it('GET /leaderboard returns 200 with top entries ordered by puntaje descending', async () => {
    const res = await request(app.getHttpServer())
      .get(`/leaderboard?idNivel=${NIVEL_ID}&limite=3`)
      .expect(200);

    expect(res.body.entradas).toHaveLength(3);
    expect(res.body.entradas[0].puntaje).toBe(900);
    expect(res.body.entradas[1].puntaje).toBe(750);
    expect(res.body.entradas[2].puntaje).toBe(600);
    expect(mockConsultaRanking.obtenerTop).toHaveBeenCalledTimes(1);
  });

  it('GET /leaderboard serves second identical request from cache', async () => {
    const firstResponse = await request(app.getHttpServer())
      .get(`/leaderboard?idNivel=${NIVEL_ID}&limite=3`)
      .expect(200);

    const secondResponse = await request(app.getHttpServer())
      .get(`/leaderboard?idNivel=${NIVEL_ID}&limite=3`)
      .expect(200);

    expect(secondResponse.body).toEqual(firstResponse.body);
    // The read port should be invoked only once — second call served from cache.
    expect(mockConsultaRanking.obtenerTop).toHaveBeenCalledTimes(1);
  });

  it('GET /leaderboard with different key bypasses the cache', async () => {
    await request(app.getHttpServer())
      .get(`/leaderboard?idNivel=${NIVEL_ID}&limite=3`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/leaderboard?idNivel=${OTRO_NIVEL_ID}&limite=3`)
      .expect(200);

    expect(mockConsultaRanking.obtenerTop).toHaveBeenCalledTimes(2);
  });

  it('GET /leaderboard returns 400 when idNivel is missing', async () => {
    await request(app.getHttpServer()).get('/leaderboard?limite=3').expect(400);
  });

  it('GET /leaderboard returns 400 when limite is missing', async () => {
    await request(app.getHttpServer())
      .get(`/leaderboard?idNivel=${NIVEL_ID}`)
      .expect(400);
  });
});
