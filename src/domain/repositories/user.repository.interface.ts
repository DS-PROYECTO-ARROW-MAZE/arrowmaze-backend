import { User } from '../entities/user.entity';

export const I_USER_REPOSITORY = 'IUserRepository';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
