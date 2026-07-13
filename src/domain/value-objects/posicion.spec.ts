import { Posicion } from './posicion';

describe('Posicion', () => {
  it('should_default_z_to_0_when_z_is_omitted', () => {
    const pos = new Posicion(3, 4);
    expect(pos.z).toBe(0);
  });

  it('should_store_an_explicit_z_when_z_is_provided', () => {
    const pos = new Posicion(1, 2, 5);
    expect(pos.z).toBe(5);
  });

  it('should_return_true_when_equals_is_called_with_the_same_x_y_and_z', () => {
    const a = new Posicion(1, 2, 3);
    const b = new Posicion(1, 2, 3);
    expect(a.equals(b)).toBe(true);
  });

  it('should_return_false_when_equals_is_called_with_a_different_z', () => {
    const a = new Posicion(1, 2, 3);
    const b = new Posicion(1, 2, 4);
    expect(a.equals(b)).toBe(false);
  });

  it('should_treat_omitted_z_as_0_when_comparing_with_equals', () => {
    const a = new Posicion(1, 2);
    const b = new Posicion(1, 2, 0);
    expect(a.equals(b)).toBe(true);
  });
});
