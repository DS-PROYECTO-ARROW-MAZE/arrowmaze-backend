import { Direccion, deltaDireccion } from './direccion';

describe('deltaDireccion', () => {
  it('should_step_y_by_minus_1_and_leave_x_and_z_at_0_when_direction_is_ARRIBA', () => {
    expect(deltaDireccion(Direccion.ARRIBA)).toEqual({ x: 0, y: -1, z: 0 });
  });

  it('should_step_y_by_1_and_leave_x_and_z_at_0_when_direction_is_ABAJO', () => {
    expect(deltaDireccion(Direccion.ABAJO)).toEqual({ x: 0, y: 1, z: 0 });
  });

  it('should_step_x_by_minus_1_and_leave_y_and_z_at_0_when_direction_is_IZQUIERDA', () => {
    expect(deltaDireccion(Direccion.IZQUIERDA)).toEqual({ x: -1, y: 0, z: 0 });
  });

  it('should_step_x_by_1_and_leave_y_and_z_at_0_when_direction_is_DERECHA', () => {
    expect(deltaDireccion(Direccion.DERECHA)).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('should_step_z_by_1_and_leave_x_and_y_at_0_when_direction_is_ADELANTE', () => {
    expect(deltaDireccion(Direccion.ADELANTE)).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('should_step_z_by_minus_1_and_leave_x_and_y_at_0_when_direction_is_ATRAS', () => {
    expect(deltaDireccion(Direccion.ATRAS)).toEqual({ x: 0, y: 0, z: -1 });
  });
});
