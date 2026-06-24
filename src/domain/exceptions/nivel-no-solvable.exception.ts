export class NivelNoSolvableException extends Error {
  constructor() {
    super('El tablero no es solvable');
    this.name = 'NivelNoSolvableException';
  }
}
