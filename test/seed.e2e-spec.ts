import { sembrarCatalogo } from '../prisma/seed';
import { construirCatalogoNiveles } from '../prisma/catalogo-niveles';
import { CrearNivelCasoDeUso } from '../src/application/use-cases/crear-nivel.use-case';
import { Nivel } from '../src/domain/aggregates/nivel';
import { IRepositorioNivel } from '../src/domain/repositories/nivel.repository.interface';
import { IGeneradorId } from '../src/application/ports/generador-id.port';
import { GrafoTablero } from '../src/domain/services/grafo-tablero';
import { esSolvable } from '../src/domain/services/solver';
import { Posicion } from '../src/domain/value-objects/posicion';
import { Celda } from '../src/domain/value-objects/celda';
import { PRIMER_NIVEL_CRONOMETRADO } from '../src/domain/aggregates/nivel';

// In-memory adapter so the seed can be exercised through the real CrearNivelCasoDeUso
// (and therefore the solvability + arrow-length gate) without a database.
class RepositorioNivelEnMemoria implements IRepositorioNivel {
  readonly niveles: Nivel[] = [];

  guardar(nivel: Nivel): Promise<void> {
    const i = this.niveles.findIndex((n) => n.id === nivel.id);
    if (i >= 0) this.niveles[i] = nivel;
    else this.niveles.push(nivel);
    return Promise.resolve();
  }

  obtenerPorId(id: string): Promise<Nivel | null> {
    return Promise.resolve(this.niveles.find((n) => n.id === id) ?? null);
  }
}

class GeneradorIdSecuencial implements IGeneradorId {
  private contador = 0;
  generar(): string {
    this.contador += 1;
    return `00000000-0000-0000-0000-${String(this.contador).padStart(12, '0')}`;
  }
}

function matrizCeldas(nivel: Nivel): Celda[][] {
  const filas: Celda[][] = [];
  for (let y = 0; y < nivel.alto; y++) {
    const fila: Celda[] = [];
    for (let x = 0; x < nivel.ancho; x++) {
      fila.push(nivel.definicionTablero.celdaEn(new Posicion(x, y)));
    }
    filas.push(fila);
  }
  return filas;
}

// Full depth-aware reconstruction (unlike matrizCeldas above, which only reads layer z=0) —
// needed to prove a multi-layer (ticket 19) board is solvable across every layer, not just
// its base.
function matrizCeldas3D(nivel: Nivel): Celda[][][] {
  const capas: Celda[][][] = [];
  for (let z = 0; z < nivel.profundo; z++) {
    const filas: Celda[][] = [];
    for (let y = 0; y < nivel.alto; y++) {
      const fila: Celda[] = [];
      for (let x = 0; x < nivel.ancho; x++) {
        fila.push(nivel.definicionTablero.celdaEn(new Posicion(x, y, z)));
      }
      filas.push(fila);
    }
    capas.push(filas);
  }
  return capas;
}

describe('Seed integrity (Ticket 16 — catalog of 15+ levels)', () => {
  const construirUseCase = (repo: RepositorioNivelEnMemoria) =>
    new CrearNivelCasoDeUso(repo, new GeneradorIdSecuencial());

  const sembrar = (repo: RepositorioNivelEnMemoria) =>
    sembrarCatalogo(construirUseCase(repo), () =>
      Promise.resolve(repo.niveles.map((n) => n.numero)),
    );

  it('should_seed_at_least_15_levels_when_run_on_an_empty_store', async () => {
    const repo = new RepositorioNivelEnMemoria();

    await sembrar(repo);

    expect(repo.niveles.length).toBeGreaterThanOrEqual(15);
  });

  it('should_seed_levels_with_distinct_consecutive_numero_starting_at_1', async () => {
    const repo = new RepositorioNivelEnMemoria();

    await sembrar(repo);

    const numeros = repo.niveles.map((n) => n.numero).sort((a, b) => a - b);
    const distintos = new Set(numeros);
    expect(distintos.size).toBe(numeros.length);
    expect(numeros[0]).toBe(1);
    expect(numeros).toEqual(
      Array.from({ length: numeros.length }, (_, i) => i + 1),
    );
  });

  it('should_only_seed_solvable_boards_that_pass_the_arrow_length_gate', async () => {
    const repo = new RepositorioNivelEnMemoria();

    // sembrarCatalogo routes every board through CrearNivelCasoDeUso, which throws on an
    // unsolvable board or a single-cell arrow — so reaching here already proves the gate.
    await expect(sembrar(repo)).resolves.toBeDefined();

    for (const nivel of repo.niveles) {
      const tablero = new GrafoTablero(
        nivel.ancho,
        nivel.alto,
        matrizCeldas(nivel),
      );
      expect(esSolvable(tablero)).toBe(true);
    }
  });

  it('should_include_at_least_one_bonus_level', async () => {
    const repo = new RepositorioNivelEnMemoria();

    await sembrar(repo);

    expect(repo.niveles.some((n) => n.esBonus)).toBe(true);
  });

  it('should_honour_the_timed_by_ordinal_rule_for_non_bonus_levels', async () => {
    const repo = new RepositorioNivelEnMemoria();

    await sembrar(repo);

    for (const nivel of repo.niveles) {
      if (nivel.esBonus) {
        expect(nivel.limiteTiempo).toBeUndefined();
        continue;
      }
      if (nivel.numero >= PRIMER_NIVEL_CRONOMETRADO) {
        expect(nivel.limiteTiempo).toBeGreaterThan(0);
      } else {
        expect(nivel.limiteTiempo).toBeUndefined();
      }
    }
  });

  it('should_be_idempotent_when_run_twice_against_the_same_store', async () => {
    const repo = new RepositorioNivelEnMemoria();

    const primera = await sembrar(repo);
    const totalTrasPrimera = repo.niveles.length;
    const segunda = await sembrar(repo);

    expect(primera.creados.length).toBe(totalTrasPrimera);
    expect(segunda.creados).toEqual([]);
    expect(segunda.omitidos.length).toBe(totalTrasPrimera);
    expect(repo.niveles.length).toBe(totalTrasPrimera);
  });

  it('should_match_the_catalog_size_with_the_number_of_seeded_levels', async () => {
    const repo = new RepositorioNivelEnMemoria();

    await sembrar(repo);

    expect(repo.niveles.length).toBe(construirCatalogoNiveles().length);
  });

  // Ticket 19/36 — the three depth-aware boards (cube/pyramid/prism) mirror
  // arrowmaze-frontend's levels 16-18: same numero, English "Level N" naming (departing
  // from the "Nivel N" pattern used by 1-15), and profundo > 1 so the frontend's merge
  // logic (CatalogoNivelesRemoto) picks up a real backend UUID instead of treating them as
  // local-only.
  describe('3D catalog levels (16-18)', () => {
    it('should_seed_levels_16_17_18_with_English_Level_N_names_and_profundo_greater_than_1', async () => {
      const repo = new RepositorioNivelEnMemoria();

      await sembrar(repo);

      for (const numero of [16, 17, 18]) {
        const nivel = repo.niveles.find((n) => n.numero === numero);
        expect(nivel).toBeDefined();
        expect(nivel!.nombre).toBe(`Level ${numero}`);
        expect(nivel!.profundo).toBeGreaterThan(1);
      }
    });

    it('should_produce_a_board_solvable_across_every_layer_for_each_3D_level', async () => {
      const repo = new RepositorioNivelEnMemoria();

      await sembrar(repo);

      for (const numero of [16, 17, 18]) {
        const nivel = repo.niveles.find((n) => n.numero === numero)!;
        const tablero = new GrafoTablero(
          nivel.ancho,
          nivel.alto,
          matrizCeldas3D(nivel),
          nivel.profundo,
        );
        expect(esSolvable(tablero)).toBe(true);
      }
    });
  });
});
