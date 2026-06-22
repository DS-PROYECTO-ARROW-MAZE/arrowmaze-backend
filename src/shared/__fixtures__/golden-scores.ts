export interface GoldenScore {
  readonly nombre: string;
  readonly baseNivel: number;
  readonly movimientos: number;
  readonly kmov: number;
  readonly ktiempo: number;
  // Legacy absolute thresholds. Since ticket 17 (proportional star rating) stars are derived
  // from proporción = Puntaje / referencia, so these no longer drive Estrellas — they are kept
  // only because Nivel.crear still requires them. The cross-repo contract is {Puntaje, Estrellas}.
  readonly umbralEstrella1: number;
  readonly umbralEstrella2: number;
  readonly umbralEstrella3: number;
  readonly limiteTiempo?: number;
  readonly segundosRestantes?: number;
  readonly esperadoPuntaje: number;
  readonly esperadoEstrellas: number;
}

// Cross-repo golden fixtures shared with arrowmaze-frontend (ticket 19). Stars are a
// proportional function of the score: referencia is the achievable maximum (a perfect run —
// 0 movimientos and, when timed, the full limiteTiempo), and proporción = Puntaje / referencia
// maps to stars by inclusive bands: proporción >= 9/10 → 3★ (near-max), >= 2/3 → 2★,
// otherwise the 1★ minimum. Each entry's comment records its referencia so the boundary is
// auditable. Both repos must flip these together (PRD §7.5 agreement).
export const goldenScores: GoldenScore[] = [
  {
    // timed referencia = 1000 + 60*5 = 1300; puntaje 1300 → proporción 1.0 → 3★.
    nombre: 'timed_perfect',
    baseNivel: 1000,
    movimientos: 0,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    limiteTiempo: 60,
    segundosRestantes: 60,
    esperadoPuntaje: 1300,
    esperadoEstrellas: 3,
  },
  {
    // referencia = 1300; puntaje 1100 → proporción ≈ 0.846 (< 9/10, >= 2/3) → 2★. The unspent
    // time counts toward the maximum, so a high absolute score is only 2★.
    nombre: 'timed_2_stars',
    baseNivel: 1000,
    movimientos: 5,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    limiteTiempo: 60,
    segundosRestantes: 30,
    esperadoPuntaje: 1100,
    esperadoEstrellas: 2,
  },
  {
    // referencia = 500 + 60*2 = 620; puntaje 120 → proporción ≈ 0.194 → 1★.
    nombre: 'timed_low_score',
    baseNivel: 500,
    movimientos: 40,
    kmov: 10,
    ktiempo: 2,
    umbralEstrella1: 400,
    umbralEstrella2: 200,
    umbralEstrella3: 100,
    limiteTiempo: 60,
    segundosRestantes: 10,
    esperadoPuntaje: 120,
    esperadoEstrellas: 1,
  },
  {
    // referencia = 100 + 30*1 = 130; puntaje floored to 0 → proporción 0 → 1★ minimum.
    nombre: 'timed_floor',
    baseNivel: 100,
    movimientos: 50,
    kmov: 10,
    ktiempo: 1,
    umbralEstrella1: 100,
    umbralEstrella2: 50,
    umbralEstrella3: 10,
    limiteTiempo: 30,
    segundosRestantes: 0,
    esperadoPuntaje: 0,
    esperadoEstrellas: 1,
  },
  {
    // untimed referencia = baseNivel = 1000; puntaje 970 → proporción 0.97 → 3★.
    nombre: 'untimed_clean',
    baseNivel: 1000,
    movimientos: 3,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    esperadoPuntaje: 970,
    esperadoEstrellas: 3,
  },
  {
    // referencia = 900; puntaje 810 → proporción exactly 9/10 → 3★ (lower edge inclusive).
    nombre: 'untimed_3star_boundary',
    baseNivel: 900,
    movimientos: 9,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    esperadoPuntaje: 810,
    esperadoEstrellas: 3,
  },
  {
    // referencia = 900; puntaje 800 → proporción 0.888… (just below 9/10) → 2★.
    nombre: 'untimed_2star_just_below_near_max',
    baseNivel: 900,
    movimientos: 10,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    esperadoPuntaje: 800,
    esperadoEstrellas: 2,
  },
  {
    // referencia = 900; puntaje 600 → proporción exactly 2/3 → 2★ (lower edge inclusive).
    nombre: 'untimed_2star_boundary',
    baseNivel: 900,
    movimientos: 30,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    esperadoPuntaje: 600,
    esperadoEstrellas: 2,
  },
  {
    // referencia = 900; puntaje 590 → proporción 0.655… (just below 2/3) → 1★.
    nombre: 'untimed_1star_just_below_two_thirds',
    baseNivel: 900,
    movimientos: 31,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    esperadoPuntaje: 590,
    esperadoEstrellas: 1,
  },
  {
    // referencia = 50; puntaje floored to 0 → proporción 0 → 1★ minimum.
    nombre: 'untimed_zero_score',
    baseNivel: 50,
    movimientos: 100,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 100,
    umbralEstrella2: 50,
    umbralEstrella3: 10,
    esperadoPuntaje: 0,
    esperadoEstrellas: 1,
  },
];
