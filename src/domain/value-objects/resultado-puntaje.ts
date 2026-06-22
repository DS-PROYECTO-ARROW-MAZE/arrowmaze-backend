export class ResultadoPuntaje {
  private constructor(
    public readonly esPuntuable: boolean,
    public readonly puntaje: number | null,
    public readonly estrellas: number | null,
  ) {}

  static puntuado(puntaje: number, estrellas: number): ResultadoPuntaje {
    return new ResultadoPuntaje(true, puntaje, estrellas);
  }

  // Bonus levels (PRD §3): time and score do not apply, so no puntaje or estrellas are
  // computed. A non-scoring result carries null fields and is never persisted as progress.
  static noPuntuable(): ResultadoPuntaje {
    return new ResultadoPuntaje(false, null, null);
  }
}
