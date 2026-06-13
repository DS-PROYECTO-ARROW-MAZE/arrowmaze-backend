import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/ports/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { SupabaseService } from './supabase.service';

@Injectable()
export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async save(user: User): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        created_at: user.createdAt.toISOString(),
      });

    if (error) throw new Error(`Error al guardar usuario: ${error.message}`);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw new Error(`Error al buscar usuario: ${error.message}`);
    if (!data) return null;

    return new User(data.id, data.email, data.password_hash, new Date(data.created_at));
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al buscar usuario: ${error.message}`);
    if (!data) return null;

    return new User(data.id, data.email, data.password_hash, new Date(data.created_at));
  }
}
