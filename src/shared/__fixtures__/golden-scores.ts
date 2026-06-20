export interface GoldenScore {
  readonly nombre: string;
  readonly baseNivel: number;
  readonly movimientos: number;
  readonly kmov: number;
  readonly ktiempo: number;
  readonly umbralEstrella1: number;
  readonly umbralEstrella2: number;
  readonly umbralEstrella3: number;
  readonly limiteTiempo?: number;
  readonly segundosRestantes?: number;
  readonly esperadoPuntaje: number;
  readonly esperadoEstrellas: number;
}

export const goldenScores: GoldenScore[] = [
  {
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
    nombre: 'timed_some_moves',
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
    esperadoEstrellas: 3,
  },
  {
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
    nombre: 'timed_negative_floor',
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
    nombre: 'untimed_many_moves',
    baseNivel: 500,
    movimientos: 25,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 500,
    umbralEstrella2: 300,
    umbralEstrella3: 100,
    esperadoPuntaje: 250,
    esperadoEstrellas: 1,
  },
  {
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
  {
    nombre: 'untimed_boundary_3_stars',
    baseNivel: 800,
    movimientos: 0,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    esperadoPuntaje: 800,
    esperadoEstrellas: 3,
  },
  {
    nombre: 'untimed_boundary_2_stars',
    baseNivel: 600,
    movimientos: 0,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
    esperadoPuntaje: 600,
    esperadoEstrellas: 2,
  },
];
