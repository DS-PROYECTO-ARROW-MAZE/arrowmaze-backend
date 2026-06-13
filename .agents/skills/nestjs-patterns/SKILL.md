---
name: nestjs-patterns
description: NestJS architecture patterns for modules, controllers, providers, DTO validation, guards, interceptors, config, and production-grade TypeScript backends.
origin: ECC
---

# NestJS Development Patterns

Production-grade NestJS patterns for modular TypeScript backends.

## When to Activate

- Building NestJS APIs or services
- Structuring modules, controllers, and providers
- Adding DTO validation, guards, interceptors, or exception filters
- Configuring environment-aware settings and database integrations
- Testing NestJS units or HTTP endpoints

## Project Structure

Hexagonal architecture (Ports & Adapters): the domain has zero framework dependencies; application defines use cases and ports; infrastructure wires everything together.

```text
src/
├── app.module.ts
├── main.ts
│
├── domain/                          ← pure TypeScript, no NestJS/ORM imports
│   ├── entities/                    ← domain models (no ORM decorators)
│   ├── value-objects/
│   ├── repositories/                ← repository interfaces (driven ports)
│   └── services/                    ← stateless domain logic
│
├── application/                     ← depends on domain only
│   ├── use-cases/                   ← one class per use case
│   ├── dtos/                        ← input/output contracts
│   ├── ports/                       ← driven-side interfaces (email, storage, etc.)
│   └── mappers/                     ← domain ↔ DTO conversion
│
└── infrastructure/                  ← framework + third-party glue
    ├── adapters/
    │   ├── http/                    ← driving adapters (NestJS HTTP)
    │   │   ├── controllers/
    │   │   ├── guards/
    │   │   ├── filters/
    │   │   ├── interceptors/
    │   │   └── pipes/
    │   └── persistence/             ← driven adapters (DB implementations)
    │       ├── repositories/        ← implements domain repository interfaces
    │       └── entities/            ← ORM-decorated models (if needed)
    ├── config/
    │   ├── configuration.ts
    │   └── validation.ts
    └── modules/                     ← NestJS module wiring
```

- `domain/` must never import from `application/`, `infrastructure/`, NestJS, or any ORM.
- `application/` imports only from `domain/`. Use cases depend on repository interfaces, not implementations.
- `infrastructure/` is the only layer that imports NestJS decorators, Supabase, Prisma, etc.
- Controllers live in `infrastructure/adapters/http/` — they are adapters, not domain logic.
- Repository implementations in `infrastructure/adapters/persistence/` implement the interfaces defined in `domain/repositories/`.

## Bootstrap and Global Validation

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- Always enable `whitelist` and `forbidNonWhitelisted` on public APIs.
- Prefer one global validation pipe instead of repeating validation config per route.

## Modules, Controllers, and Providers

Each feature is wired in `infrastructure/modules/`. The controller delegates to an application use case; the use case depends on a domain repository interface that the infrastructure repository implements.

```ts
// infrastructure/modules/users.module.ts
@Module({
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    { provide: USER_REPOSITORY, useClass: SupabaseUserRepository },
  ],
})
export class UsersModule {}

// infrastructure/adapters/http/controllers/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.createUser.getById(id);
  }
}

// application/use-cases/create-user.use-case.ts
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = User.create(dto);          // domain entity factory
    await this.userRepo.save(user);
    return UserMapper.toResponse(user);
  }
}

// domain/repositories/user.repository.interface.ts  (port)
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
}

// infrastructure/adapters/persistence/repositories/supabase-user.repository.ts
@Injectable()
export class SupabaseUserRepository implements IUserRepository {
  async save(user: User): Promise<void> { /* Supabase call */ }
  async findById(id: string): Promise<User | null> { /* Supabase call */ }
}
```

- Controllers are thin HTTP adapters: parse input, call one use case, return the result.
- Use cases own business flow; they speak domain language and depend on interfaces, not concrete repos.
- Inject repository implementations via a Symbol token so use cases never import infrastructure.

## DTOs and Validation

DTOs live in `application/dtos/` — they are the contract between the HTTP adapter and the use case. Domain entities must never be returned directly from controllers.

```ts
// application/dtos/create-user.dto.ts
export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 80)
  name!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

// application/mappers/user.mapper.ts
export class UserMapper {
  static toResponse(user: User): UserResponseDto {
    return { id: user.id, email: user.email, name: user.name };
  }
}
```

- Validate every request DTO with `class-validator` at the HTTP adapter boundary.
- Use mappers in `application/mappers/` to convert domain entities to response DTOs.
- Avoid leaking internal fields such as password hashes, tokens, or audit columns.

## Auth, Guards, and Request Context

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin/report')
getAdminReport(@Req() req: AuthenticatedRequest) {
  return this.reportService.getForUser(req.user.id);
}
```

- Keep auth strategies and guards module-local unless they are truly shared.
- Encode coarse access rules in guards, then do resource-specific authorization in services.
- Prefer explicit request types for authenticated request objects.

## Exception Filters and Error Shape

```ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json({
        path: request.url,
        error: exception.getResponse(),
      });
    }

    return response.status(500).json({
      path: request.url,
      error: 'Internal server error',
    });
  }
}
```

- Keep one consistent error envelope across the API.
- Throw framework exceptions for expected client errors; log and wrap unexpected failures centrally.

## Config and Environment Validation

```ts
ConfigModule.forRoot({
  isGlobal: true,
  load: [configuration],
  validate: validateEnv,
});
```

- Validate env at boot, not lazily at first request.
- Keep config access behind typed helpers or config services.
- Split dev/staging/prod concerns in config factories instead of branching throughout feature code.

## Persistence and Transactions

- Define repository interfaces (ports) in `domain/repositories/` — no ORM types, only domain entities.
- Implement those interfaces in `infrastructure/adapters/persistence/repositories/` — this is the only place Supabase, Prisma, or TypeORM imports are allowed.
- Isolate transactional workflows inside use cases or domain services; controllers must never coordinate multi-step writes directly.

## Testing

```ts
describe('UsersController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
});
```

- Unit test providers in isolation with mocked dependencies.
- Add request-level tests for guards, validation pipes, and exception filters.
- Reuse the same global pipes/filters in tests that you use in production.

## Production Defaults

- Enable structured logging and request correlation ids.
- Terminate on invalid env/config instead of booting partially.
- Prefer async provider initialization for DB/cache clients with explicit health checks.
- Keep background jobs and event consumers in their own modules, not inside HTTP controllers.
- Make rate limiting, auth, and audit logging explicit for public endpoints.
