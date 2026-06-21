import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IGeneradorId } from '../../../application/ports/generador-id.port';

/**
 * The single place Node's `crypto` is allowed to mint identities. Realizes the
 * IGeneradorId port so the domain and application layers stay framework-free.
 */
@Injectable()
export class CryptoGeneradorIdAdapter implements IGeneradorId {
  generar(): string {
    return randomUUID();
  }
}
