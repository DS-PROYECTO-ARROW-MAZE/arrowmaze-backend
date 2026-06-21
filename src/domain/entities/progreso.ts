export interface ProgresoParams {
  jugadorId: string;
  nivelId: string;
  movimientos: number;
  puntaje: number;
  estrellas: number;
  completadoEn: Date;
  segundosRestantes?: number;
  // Identity is assigned by the application layer (via IGeneradorId) and passed in — the
  // domain never reaches for Node `crypto`, keeping this factory pure and deterministic.
  id: string;
}

export class Progreso {
  private constructor(
    public readonly id: string,
    public readonly jugadorId: string,
    public readonly nivelId: string,
    public readonly movimientos: number,
    public readonly puntaje: number,
    public readonly estrellas: number,
    public readonly completadoEn: Date,
    public readonly segundosRestantes?: number,
  ) {}

  static crear(params: ProgresoParams): Progreso {
    return new Progreso(
      params.id,
      params.jugadorId,
      params.nivelId,
      params.movimientos,
      params.puntaje,
      params.estrellas,
      params.completadoEn,
      params.segundosRestantes,
    );
  }
}
