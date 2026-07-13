import {
  CrearNivelDto,
  CeldaDto,
} from '../src/application/dtos/crear-nivel.dto';
import { perfilDificultad } from '../src/domain/services/perfil-dificultad';

// Size of the flat/2D authored batch (numero 1-15). Growing it is a matter of bumping this
// number — the geometry, difficulty band and timing all derive from `numero` via
// PerfilDificultad, so adding a 2D level is data, not code (Ticket 16 ♻️). The three
// depth-aware levels (16-18, ticket 19/36) are appended separately below, since their shape
// (cube/pyramid/prism) isn't derivable from PerfilDificultad's flat-board profile.
export const TOTAL_NIVELES = 15;

// The single non-scoring level (PRD §3). Kept in the untimed range so it is unambiguously
// exempt from both the timer and scoring paths.
export const NUMERO_BONUS = 5;

// Shared scoring tuning. `umbralEstrella*` are inert since Ticket 17 (stars are proportional
// to the final score) but Nivel.crear still requires them.
const BASE_NIVEL = 1000;
const KMOV = 10;
const KTIEMPO = 5;
const UMBRAL_ESTRELLA_1 = 800;
const UMBRAL_ESTRELLA_2 = 600;
const UMBRAL_ESTRELLA_3 = 400;

function dificultadPara(numero: number): string {
  if (numero <= 5) return 'FACIL';
  if (numero <= 10) return 'MEDIO';
  return 'DIFICIL';
}

// Timed levels get a budget that tightens as the ordinal climbs, always strictly positive.
function limiteTiempoPara(numero: number): number {
  return 120 - (numero - 10) * 10;
}

// Every cell is a DERECHA arrow except the trailing empty column. That column gives each
// arrow a ray of length >= 2 (DefinicionTablero invariant) and lets the board be cleared
// right-to-left, so it is genuinely solvable for any ancho >= 2.
function construirCeldas(ancho: number, alto: number): CeldaDto[][] {
  const filas: CeldaDto[][] = [];
  for (let y = 0; y < alto; y++) {
    const fila: CeldaDto[] = [];
    for (let x = 0; x < ancho; x++) {
      fila.push(
        x === ancho - 1
          ? { tipo: 'vacia' }
          : { tipo: 'flecha', direccion: 'DERECHA' },
      );
    }
    filas.push(fila);
  }
  return filas;
}

// A cell is part of the shape unless a `presente` predicate says otherwise (defaults to a
// dense box — every position present).
type PredicadoPresente = (x: number, y: number, z: number) => boolean;

// One (z, y) row: the last present cell is 'vacia' (its exit), every other present cell is a
// DERECHA arrow, and every absent cell is 'ausente'. Same proof as the flat 2D catalog above,
// generalized per row — each row clears right-to-left independently of its neighbours, on
// any axis, so density or shape elsewhere on the board never affects a row's own solvability.
function construirFila3D(
  ancho: number,
  y: number,
  z: number,
  presente: PredicadoPresente,
): CeldaDto[] {
  const presentesEnFila: number[] = [];
  for (let x = 0; x < ancho; x++) {
    if (presente(x, y, z)) presentesEnFila.push(x);
  }
  const ultimoPresente = presentesEnFila[presentesEnFila.length - 1];

  const fila: CeldaDto[] = [];
  for (let x = 0; x < ancho; x++) {
    if (!presente(x, y, z)) {
      fila.push({ tipo: 'ausente' });
    } else if (x === ultimoPresente) {
      fila.push({ tipo: 'vacia' });
    } else {
      fila.push({ tipo: 'flecha', direccion: 'DERECHA' });
    }
  }
  return fila;
}

function construirCeldas3D(
  ancho: number,
  alto: number,
  profundo: number,
  presente: PredicadoPresente = () => true,
): CeldaDto[][][] {
  const capas: CeldaDto[][][] = [];
  for (let z = 0; z < profundo; z++) {
    const filas: CeldaDto[][] = [];
    for (let y = 0; y < alto; y++) {
      filas.push(construirFila3D(ancho, y, z, presente));
    }
    capas.push(filas);
  }
  return capas;
}

// Pyramid taper: layer z's playable footprint shrinks by one cell on every side, centred,
// so the base (z=0) is the full ancho x alto square and the top layer is a single cell.
function presentePiramide(ancho: number, alto: number): PredicadoPresente {
  return (x, y, z) => x >= z && x < ancho - z && y >= z && y < alto - z;
}

interface Nivel3D {
  readonly numero: number;
  readonly nombre: string;
  readonly ancho: number;
  readonly alto: number;
  readonly profundo: number;
  readonly presente?: PredicadoPresente;
}

// The three depth-aware boards (ticket 19/36): a dense cube, a tapered pyramid, and a dense
// rectangular prism. Named "Level N" in English — departing from the "Nivel N" pattern used
// by 1-15 — per the product decision that these three carry an English name regardless of
// the active locale. Their shape is what makes them 3D; the frontend never loads gameplay
// geometry from here (it always reads its own bundled asset), so this board only has to be
// genuinely solvable and length-valid, not a byte-for-byte mirror of the Dart fixtures.
const NIVELES_3D: readonly Nivel3D[] = [
  { numero: 16, nombre: 'Nivel 16', ancho: 3, alto: 3, profundo: 3 },
  {
    numero: 17,
    nombre: 'Nivel 17',
    ancho: 5,
    alto: 5,
    profundo: 3,
    presente: presentePiramide(5, 5),
  },
  { numero: 18, nombre: 'Nivel 18', ancho: 3, alto: 5, profundo: 2 },
];

// Builds the ordered list of level definitions. Pure data derivation: complexity scales
// with `numero` via PerfilDificultad and each board satisfies the create-path gate, so the
// list round-trips through CrearNivelCasoDeUso without bypassing any invariant.
export function construirCatalogoNiveles(): CrearNivelDto[] {
  const catalogo: CrearNivelDto[] = [];

  for (let numero = 1; numero <= TOTAL_NIVELES; numero++) {
    const perfil = perfilDificultad(numero);
    const esBonus = numero === NUMERO_BONUS;

    catalogo.push({
      nombre: `Nivel ${numero}`,
      dificultad: dificultadPara(numero),
      ancho: perfil.ancho,
      alto: perfil.alto,
      celdas: construirCeldas(perfil.ancho, perfil.alto),
      baseNivel: BASE_NIVEL,
      kmov: KMOV,
      ktiempo: KTIEMPO,
      umbralEstrella1: UMBRAL_ESTRELLA_1,
      umbralEstrella2: UMBRAL_ESTRELLA_2,
      umbralEstrella3: UMBRAL_ESTRELLA_3,
      numero,
      esBonus,
      // Bonus levels ignore time; timed ordinals (>= 10) require a budget; the rest must not
      // declare one (Nivel's timed-by-ordinal rule).
      limiteTiempo:
        !esBonus && perfil.cronometrado ? limiteTiempoPara(numero) : undefined,
    });
  }

  for (const nivel3D of NIVELES_3D) {
    catalogo.push({
      nombre: nivel3D.nombre,
      // Kept "easy" to match the frontend's local level_16/17/18.json authoring — inert for
      // display either way, since the frontend's card shows "3D" instead of a difficulty
      // label whenever profundo > 1 (es3D).
      dificultad: 'FACIL',
      ancho: nivel3D.ancho,
      alto: nivel3D.alto,
      profundo: nivel3D.profundo,
      celdas: construirCeldas3D(
        nivel3D.ancho,
        nivel3D.alto,
        nivel3D.profundo,
        nivel3D.presente,
      ),
      baseNivel: BASE_NIVEL,
      kmov: KMOV,
      ktiempo: KTIEMPO,
      umbralEstrella1: UMBRAL_ESTRELLA_1,
      umbralEstrella2: UMBRAL_ESTRELLA_2,
      umbralEstrella3: UMBRAL_ESTRELLA_3,
      numero: nivel3D.numero,
      esBonus: false,
      // numero >= PRIMER_NIVEL_CRONOMETRADO (10) requires a budget (Nivel's timed-by-ordinal
      // rule) — same tightening formula as the flat catalog's timed range.
      limiteTiempo: limiteTiempoPara(nivel3D.numero),
    });
  }

  return catalogo;
}
