import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IRepositorioNivel } from '../../../../domain/repositories/nivel.repository.interface';
import { Nivel } from '../../../../domain/aggregates/nivel';
import { NumeroNivelDuplicadoException } from '../../../../domain/exceptions/numero-nivel-duplicado.exception';
import { PrismaService } from '../prisma/prisma.service';
import { NivelPrismaMapper } from '../mappers/nivel.prisma.mapper';

@Injectable()
export class PrismaNivelRepository implements IRepositorioNivel {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(nivel: Nivel): Promise<void> {
    try {
      const exists = await this.prisma.nivel.findUnique({
        where: { id: nivel.id },
        select: { id: true },
      });
      if (exists) {
        const args = NivelPrismaMapper.toUpdateArgs(nivel);
        await this.prisma.nivel.update(args);
      } else {
        const data = NivelPrismaMapper.toPersistence(nivel);
        await this.prisma.nivel.create({ data });
      }
    } catch (error) {
      // Translate the store's unique-constraint violation on `numero` into a
      // domain exception so the application/domain layers stay Prisma-free and
      // the HTTP layer can answer 409 instead of a generic 500.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        (error.meta?.target as string[] | undefined)?.includes('numero')
      ) {
        throw new NumeroNivelDuplicadoException(nivel.numero);
      }
      throw error;
    }
  }

  async obtenerPorId(id: string): Promise<Nivel | null> {
    const row = await this.prisma.nivel.findUnique({
      where: { id },
      include: { celdas: true },
    });
    return row ? NivelPrismaMapper.toDomain(row) : null;
  }
}
