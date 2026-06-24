import {
  CrearNivelDto,
  CeldaDto,
} from '../src/application/dtos/crear-nivel.dto';
import { perfilDificultad } from '../src/domain/services/perfil-dificultad';

// Size of the authored catalog. Growing it to 16+ is a matter of bumping this number — the
// geometry, difficulty band and timing all derive from `numero` via PerfilDificultad, so
// adding a level is data, not code (Ticket 16 ♻️).
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

  return catalogo;
}
