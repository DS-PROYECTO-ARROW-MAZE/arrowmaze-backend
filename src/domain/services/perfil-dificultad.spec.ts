import { perfilDificultad } from './perfil-dificultad';
import { PRIMER_NIVEL_CRONOMETRADO } from '../aggregates/nivel';

describe('perfilDificultad (PRD §3 complexity-scaling rule)', () => {
  const numeros = Array.from({ length: 15 }, (_, i) => i + 1);

  it('should_grow_cells_monotonically_non_decreasing_when_numero_rises_from_1_to_15', () => {
    // Arrange
    const perfiles = numeros.map((n) => perfilDificultad(n));

    // Act / Assert
    for (let i = 1; i < perfiles.length; i++) {
      expect(perfiles[i].celdas).toBeGreaterThanOrEqual(perfiles[i - 1].celdas);
    }
  });

  it('should_grow_arrows_monotonically_non_decreasing_when_numero_rises_from_1_to_15', () => {
    // Arrange
    const perfiles = numeros.map((n) => perfilDificultad(n));

    // Act / Assert
    for (let i = 1; i < perfiles.length; i++) {
      expect(perfiles[i].flechas).toBeGreaterThanOrEqual(
        perfiles[i - 1].flechas,
      );
    }
  });

  it('should_make_level_10_at_least_as_complex_as_level_1_in_cells_and_arrows', () => {
    // Arrange
    const nivel1 = perfilDificultad(1);
    const nivel10 = perfilDificultad(10);

    // Act / Assert
    expect(nivel10.celdas).toBeGreaterThanOrEqual(nivel1.celdas);
    expect(nivel10.flechas).toBeGreaterThanOrEqual(nivel1.flechas);
  });

  it('should_strictly_increase_complexity_from_level_1_to_level_15', () => {
    // Arrange
    const nivel1 = perfilDificultad(1);
    const nivel15 = perfilDificultad(15);

    // Act / Assert
    expect(nivel15.celdas).toBeGreaterThan(nivel1.celdas);
    expect(nivel15.flechas).toBeGreaterThan(nivel1.flechas);
  });

  it('should_mark_levels_below_the_boundary_as_untimed', () => {
    for (let n = 1; n < PRIMER_NIVEL_CRONOMETRADO; n++) {
      expect(perfilDificultad(n).cronometrado).toBe(false);
    }
  });

  it('should_mark_levels_at_or_above_the_boundary_as_timed', () => {
    for (let n = PRIMER_NIVEL_CRONOMETRADO; n <= 15; n++) {
      expect(perfilDificultad(n).cronometrado).toBe(true);
    }
  });

  it('should_leave_room_for_an_arrow_length_of_at_least_2_in_every_profile', () => {
    // Each board keeps a trailing empty column, so a DERECHA arrow always has a
    // >=2-cell ray: this requires ancho >= 2 and at least one arrow.
    for (const n of numeros) {
      const perfil = perfilDificultad(n);
      expect(perfil.ancho).toBeGreaterThanOrEqual(2);
      expect(perfil.flechas).toBeGreaterThanOrEqual(1);
    }
  });

  it('should_keep_celdas_and_flechas_consistent_with_board_geometry', () => {
    for (const n of numeros) {
      const perfil = perfilDificultad(n);
      expect(perfil.celdas).toBe(perfil.ancho * perfil.alto);
      // Last column is empty (non-arrow); every other cell is a DERECHA arrow.
      expect(perfil.flechas).toBe((perfil.ancho - 1) * perfil.alto);
    }
  });

  it('should_reject_a_numero_below_1', () => {
    expect(() => perfilDificultad(0)).toThrow();
  });
});
