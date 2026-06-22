// Raised when a level's timed configuration contradicts its ordinal (PRD §3 rule table):
// levels numbered >= PRIMER_NIVEL_CRONOMETRADO must declare a limiteTiempo, and levels
// below it must not. Bonus levels are exempt — on them time does not apply at all.
export class ReglaTiempoNivelException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReglaTiempoNivelException';
  }
}
