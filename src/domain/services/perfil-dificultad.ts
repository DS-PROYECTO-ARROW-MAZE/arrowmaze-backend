import { PRIMER_NIVEL_CRONOMETRADO } from '../aggregates/nivel';

// Number of levels the difficulty curve grows by one step. Every two ordinals the board
// gains a row and a column, so cells/arrows rise smoothly without jumping per level.
const NIVELES_POR_ESCALON = 2;

// Smallest board edge. The catalog reserves a trailing empty column so every DERECHA arrow
// keeps a >=2-cell ray (DefinicionTablero invariant); a width below 2 could not hold one.
const LADO_BASE = 3;

export interface PerfilNivel {
  readonly numero: number;
  readonly ancho: number;
  readonly alto: number;
  // Total cells in the bounding box (ancho * alto).
  readonly celdas: number;
  // Playable arrows the board should contain — every cell except the trailing empty column.
  readonly flechas: number;
  // Mirrors Nivel's timed-by-ordinal rule (numero >= PRIMER_NIVEL_CRONOMETRADO).
  readonly cronometrado: boolean;
}

// Pure, I/O-free derivation of a level's target geometry from its ordinal. Monotonic
// non-decreasing in cells and arrows so complexity provably scales with `numero`, and the
// timed/untimed boundary stays the single source of truth shared with the Nivel aggregate.
// Reusable as the frontend generator's contract (no domain entities required).
export function perfilDificultad(numero: number): PerfilNivel {
  if (!Number.isInteger(numero) || numero < 1) {
    throw new RangeError(
      `El número de nivel debe ser un entero >= 1 (recibido: ${numero})`,
    );
  }

  const escalon = Math.floor((numero - 1) / NIVELES_POR_ESCALON);
  const ancho = LADO_BASE + escalon;
  const alto = LADO_BASE + escalon;

  return {
    numero,
    ancho,
    alto,
    celdas: ancho * alto,
    flechas: (ancho - 1) * alto,
    cronometrado: numero >= PRIMER_NIVEL_CRONOMETRADO,
  };
}
