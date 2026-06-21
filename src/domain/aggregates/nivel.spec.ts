import { Nivel } from './nivel';
import { DefinicionTablero } from '../value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../value-objects/celda';
import { Direccion } from '../value-objects/direccion';

describe('Nivel', () => {
  const celdasSolvable = [
    [FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)],
  ];
  const definicion = DefinicionTablero.crear(1, 1, celdasSolvable);

  it('creates a Nivel with valid data', () => {
    const nivel = Nivel.crear({
      id: 'nivel-test',
      nombre: 'Test Level',
      dificultad: 'FACIL',
      definicionTablero: definicion,
      ancho: 1,
      alto: 1,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
    });

    expect(nivel.nombre).toBe('Test Level');
    expect(nivel.dificultad).toBe('FACIL');
    expect(nivel.ancho).toBe(1);
    expect(nivel.alto).toBe(1);
    expect(nivel.baseNivel).toBe(1000);
    expect(nivel.kmov).toBe(10);
    expect(nivel.ktiempo).toBe(5);
    expect(nivel.umbralEstrella1).toBe(800);
    expect(nivel.umbralEstrella2).toBe(600);
    expect(nivel.umbralEstrella3).toBe(400);
    expect(nivel.limiteTiempo).toBeUndefined();
    expect(nivel.id).toBeDefined();
    expect(typeof nivel.id).toBe('string');
  });

  it('creates a Nivel with limiteTiempo', () => {
    const nivel = Nivel.crear({
      id: 'nivel-timed',
      nombre: 'Timed Level',
      dificultad: 'MEDIO',
      definicionTablero: definicion,
      ancho: 1,
      alto: 1,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
      limiteTiempo: 120,
    });

    expect(nivel.limiteTiempo).toBe(120);
  });
});
