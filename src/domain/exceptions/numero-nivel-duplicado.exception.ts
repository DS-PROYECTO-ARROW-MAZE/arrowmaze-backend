// Raised when persisting a level whose `numero` (its ordinal in the campaign) is
// already taken. `numero` is unique across levels, so two levels cannot share an
// ordinal. The infrastructure layer translates the underlying store's unique-constraint
// violation into this domain exception so the application/domain layers never name Prisma.
export class NumeroNivelDuplicadoException extends Error {
  constructor(numero: number) {
    super(`Ya existe un nivel con el número ${numero}`);
    this.name = 'NumeroNivelDuplicadoException';
  }
}
