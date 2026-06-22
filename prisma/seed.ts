import { CrearNivelDto } from '../src/application/dtos/crear-nivel.dto';
import { CrearNivelCasoDeUso } from '../src/application/use-cases/crear-nivel.use-case';
import { PrismaService } from '../src/infrastructure/adapters/persistence/prisma/prisma.service';
import { PrismaNivelRepository } from '../src/infrastructure/adapters/persistence/repositories/prisma-nivel.repository';
import { CryptoGeneradorIdAdapter } from '../src/infrastructure/adapters/identity/crypto-generador-id.adapter';
import { construirCatalogoNiveles } from './catalogo-niveles';

// Minimal surface of the create use case the seed needs — keeps `sembrarCatalogo` testable
// with an in-memory stand-in instead of a database.
interface AutorDeNivel {
  execute(dto: CrearNivelDto): Promise<unknown>;
}

export interface ResultadoSiembra {
  // numeros that were authored on this run.
  readonly creados: number[];
  // numeros skipped because they already existed (idempotency).
  readonly omitidos: number[];
}

// Authors every catalog level that is not yet present, through the create path so the
// solvability + arrow-length gate is enforced. Re-running is idempotent: levels whose
// `numero` already exists are skipped, never duplicated.
export async function sembrarCatalogo(
  autor: AutorDeNivel,
  numerosExistentes: () => Promise<number[]>,
): Promise<ResultadoSiembra> {
  const existentes = new Set(await numerosExistentes());
  const creados: number[] = [];
  const omitidos: number[] = [];

  for (const dto of construirCatalogoNiveles()) {
    const numero = dto.numero as number;
    if (existentes.has(numero)) {
      omitidos.push(numero);
      continue;
    }
    await autor.execute(dto);
    creados.push(numero);
  }

  return { creados, omitidos };
}

async function main(): Promise<void> {
  const prisma = new PrismaService();
  try {
    const autor = new CrearNivelCasoDeUso(
      new PrismaNivelRepository(prisma),
      new CryptoGeneradorIdAdapter(),
    );

    const { creados, omitidos } = await sembrarCatalogo(autor, async () => {
      const filas = await prisma.nivel.findMany({ select: { numero: true } });
      return filas.map((f) => f.numero);
    });

    console.log(
      `Seed completo — niveles creados: ${creados.length}, omitidos (ya existían): ${omitidos.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
