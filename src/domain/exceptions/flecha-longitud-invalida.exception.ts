// Raised when a board would contain an arrow whose ray resolves to a single cell — i.e.
// the move does not actually travel anywhere. Every arrow must traverse at least
// LONGITUD_MINIMA_FLECHA cells (see definicion-tablero.ts).
export class FlechaLongitudInvalidaException extends Error {
  constructor() {
    super(
      'Una flecha resuelve a un movimiento de una sola celda (longitud mínima 2)',
    );
    this.name = 'FlechaLongitudInvalidaException';
  }
}
