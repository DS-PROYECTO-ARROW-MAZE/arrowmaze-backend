import { DefinicionTablero } from '../value-objects/definicion-tablero';
import { ReglaTiempoNivelException } from '../exceptions/regla-tiempo-nivel.exception';

// First ordinal that is played against the clock. Levels with numero >= this value require
// a limiteTiempo; levels below it (1-9) are untimed and must not declare one (PRD §3 rule
// table). Bonus levels are exempt entirely.
export const PRIMER_NIVEL_CRONOMETRADO = 10;

export interface CrearNivelParams {
  nombre: string;
  dificultad: string;
  definicionTablero: DefinicionTablero;
  ancho: number;
  alto: number;
  baseNivel: number;
  kmov: number;
  ktiempo: number;
  umbralEstrella1: number;
  umbralEstrella2: number;
  umbralEstrella3: number;
  limiteTiempo?: number;
  // Ordinal that fixes play order and gates the timed rule. Optional here so synthetic
  // fixtures and legacy restores need not invent one; real creation supplies it via the DTO.
  numero?: number;
  // When true, time and score do not apply: no timer, no Puntaje/Estrellas (PRD §3).
  esBonus?: boolean;
  // Identity is assigned by the application layer (via IGeneradorId) and passed in — the
  // domain never reaches for Node `crypto`, keeping this factory pure and deterministic.
  id: string;
}

export class Nivel {
  private constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly dificultad: string,
    public readonly definicionTablero: DefinicionTablero,
    public readonly ancho: number,
    public readonly alto: number,
    public readonly baseNivel: number,
    public readonly kmov: number,
    public readonly ktiempo: number,
    public readonly umbralEstrella1: number,
    public readonly umbralEstrella2: number,
    public readonly umbralEstrella3: number,
    public readonly numero: number,
    public readonly esBonus: boolean,
    public readonly limiteTiempo?: number,
  ) {}

  static crear(params: CrearNivelParams): Nivel {
    const esBonus = params.esBonus ?? false;

    // When a caller omits numero, default to a value consistent with limiteTiempo so the
    // invariant below never fires spuriously; explicit numero is always validated.
    const numero =
      params.numero ??
      (params.limiteTiempo !== undefined ? PRIMER_NIVEL_CRONOMETRADO : 1);

    // Bonus levels ignore time: drop any limiteTiempo and skip the timed-by-ordinal rule.
    const limiteTiempo = esBonus ? undefined : params.limiteTiempo;

    if (!esBonus) {
      Nivel.validarReglaTiempo(numero, limiteTiempo);
    }

    return new Nivel(
      params.id,
      params.nombre,
      params.dificultad,
      params.definicionTablero,
      params.ancho,
      params.alto,
      params.baseNivel,
      params.kmov,
      params.ktiempo,
      params.umbralEstrella1,
      params.umbralEstrella2,
      params.umbralEstrella3,
      numero,
      esBonus,
      limiteTiempo,
    );
  }

  // A non-bonus level is scoring; bonus levels are not (PRD §3). Used by the scoring use
  // case to take the non-scoring path without inspecting esBonus directly.
  get esPuntuable(): boolean {
    return !this.esBonus;
  }

  private static validarReglaTiempo(
    numero: number,
    limiteTiempo: number | undefined,
  ): void {
    const debeSerCronometrado = numero >= PRIMER_NIVEL_CRONOMETRADO;
    const tieneTiempo = limiteTiempo !== undefined;

    if (debeSerCronometrado && !tieneTiempo) {
      throw new ReglaTiempoNivelException(
        `El nivel ${numero} (>= ${PRIMER_NIVEL_CRONOMETRADO}) requiere un límite de tiempo`,
      );
    }
    if (!debeSerCronometrado && tieneTiempo) {
      throw new ReglaTiempoNivelException(
        `El nivel ${numero} (< ${PRIMER_NIVEL_CRONOMETRADO}) no admite límite de tiempo`,
      );
    }
  }
}
