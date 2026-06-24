import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IHashContrasena } from '../../../application/ports/hash-contrasena.port';

const DEFAULT_SALT_ROUNDS = 10;

@Injectable()
export class BcryptHashAdapter implements IHashContrasena {
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService) {
    const configuredRounds =
      this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    this.saltRounds = configuredRounds
      ? parseInt(configuredRounds, 10)
      : DEFAULT_SALT_ROUNDS;
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
