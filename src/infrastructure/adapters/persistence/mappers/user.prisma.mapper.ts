import { User } from '../../../../domain/entities/user.entity';

export class UserPrismaMapper {
  static toPersistence(user: User) {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
    };
  }

  static toDomain(row: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  }): User {
    return new User(row.id, row.email, row.passwordHash, row.createdAt);
  }
}
