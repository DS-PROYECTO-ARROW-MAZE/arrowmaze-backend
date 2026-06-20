import { Injectable } from '@nestjs/common';
import { IRepositorioNivel } from '../../../../domain/repositories/nivel.repository.interface';
import { Nivel } from '../../../../domain/aggregates/nivel';
import { PrismaService } from '../prisma/prisma.service';
import { NivelPrismaMapper } from '../mappers/nivel.prisma.mapper';

@Injectable()
export class PrismaNivelRepository implements IRepositorioNivel {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(nivel: Nivel): Promise<void> {
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
  }

  async obtenerPorId(id: string): Promise<Nivel | null> {
    const row = await this.prisma.nivel.findUnique({
      where: { id },
      include: { celdas: true },
    });
    return row ? NivelPrismaMapper.toDomain(row) : null;
  }
}
