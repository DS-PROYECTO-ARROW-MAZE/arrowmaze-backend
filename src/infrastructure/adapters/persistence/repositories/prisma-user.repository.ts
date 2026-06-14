import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../domain/entities/user.entity';
import { PrismaService } from '../prisma/prisma.service';
import { UserPrismaMapper } from '../mappers/user.prisma.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    const data = UserPrismaMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? UserPrismaMapper.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? UserPrismaMapper.toDomain(row) : null;
  }
}
