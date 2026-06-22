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
});
