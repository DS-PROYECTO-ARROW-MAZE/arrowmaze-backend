import { User as UserRow } from '@prisma/client';
import { User } from '../../../../domain/entities/user.entity';

export class UserPrismaMapper {
  static toDomain(row: UserRow): User {
    return new User(row.id, row.email, row.passwordHash, row.createdAt);
  }

  static toPersistence(user: User) {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
    };
  }
}
