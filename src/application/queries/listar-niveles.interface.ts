import { NivelResumenDto } from '../dtos/nivel-resumen.dto';

export const I_LISTAR_NIVELES = Symbol('IListarNiveles');

// Read port for the ordered level catalog (PRD §9.5 — read-only projection, no write side).
// Implementations return summaries ordered by `numero` ascending, without board cells.
export interface IListarNiveles {
  listar(): Promise<NivelResumenDto[]>;
}
