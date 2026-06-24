import { Nivel } from '../aggregates/nivel';

export const NIVEL_REPOSITORY = Symbol('NIVEL_REPOSITORY');

export interface IRepositorioNivel {
  guardar(nivel: Nivel): Promise<void>;
  obtenerPorId(id: string): Promise<Nivel | null>;
}
