import { Injectable } from '@nestjs/common';
import { IRepositorioProgreso } from '../../../../domain/repositories/progreso.repository.interface';
import { Progreso } from '../../../../domain/entities/progreso';
import { PrismaService } from '../prisma/prisma.service';
import { ProgresoPrismaMapper } from '../mappers/progreso.prisma.mapper';

@Injectable()
export class PrismaProgresoRepository implements IRepositorioProgreso {
  constructor(private readonly prisma: PrismaService) {}

  // ADR-0003: the $transaction is encapsulated here, inside the adapter — the application
  // layer hands over a plain Progreso[] and never names Prisma.
  async guardarLote(progresos: Progreso[]): Promise<void> {
    const escrituras = progresos.map((progreso) =>
      this.prisma.progreso.create({
        data: ProgresoPrismaMapper.toCreateInput(progreso),
      }),
    );

    await this.prisma.$transaction(escrituras);
  }
}
