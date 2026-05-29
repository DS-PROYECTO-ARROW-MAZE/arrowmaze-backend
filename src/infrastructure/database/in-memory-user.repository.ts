// src/infrastructure/database/in-memory-user.repository.ts

import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/ports/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  // Simulamos una base de datos con un arreglo en memoria
  private readonly users: User[] = [];

  save(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve(); // Devolvemos una promesa resuelta
  }

  findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email);
    return Promise.resolve(user || null);
  }

  findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return Promise.resolve(user || null);
  }
}
