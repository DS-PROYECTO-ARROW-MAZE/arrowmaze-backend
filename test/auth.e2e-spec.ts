import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/adapters/persistence/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = `e2e-${randomUUID()}@arrowmaze.test`;
  const password = 'secreta123';

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('should_persist_a_hashed_password_when_registering_a_new_email', async () => {
    // Act
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    // Assert
    const row = await prisma.user.findUnique({ where: { email } });
    expect(row).not.toBeNull();
    expect(row?.passwordHash).not.toBe(password);
  });

  it('should_return_409_and_skip_the_write_when_email_is_already_registered', async () => {
    // Act
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(409);

    // Assert
    const rows = await prisma.user.findMany({ where: { email } });
    expect(rows).toHaveLength(1);
  });
});
