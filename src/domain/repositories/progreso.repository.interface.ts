import { Progreso } from '../entities/progreso';

export const PROGRESO_REPOSITORY = Symbol('PROGRESO_REPOSITORY');

// ADR-0003: no Unit of Work — guardarLote persists the whole batch atomically via a
// $transaction encapsulated inside the Prisma adapter; this port never names Prisma.
export interface IRepositorioProgreso {
  guardarLote(progresos: Progreso[]): Promise<void>;
}
