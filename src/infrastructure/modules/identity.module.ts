import { Module } from '@nestjs/common';
import { I_GENERADOR_ID } from '../../application/ports/generador-id.port';
import { CryptoGeneradorIdAdapter } from '../adapters/identity/crypto-generador-id.adapter';

/**
 * Binds the IGeneradorId port to its crypto-backed adapter and exports the token so any
 * feature module (levels, progress, auth) can inject identity generation without each one
 * re-declaring the provider.
 */
@Module({
  providers: [{ provide: I_GENERADOR_ID, useClass: CryptoGeneradorIdAdapter }],
  exports: [I_GENERADOR_ID],
})
export class IdentityModule {}
