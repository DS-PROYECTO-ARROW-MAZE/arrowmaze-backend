import { Nivel } from '../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../domain/value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../../domain/value-objects/celda';
import { Direccion } from '../../domain/value-objects/direccion';
import { CalcularPuntuacionCasoDeUso } from '../../application/use-cases/calcular-puntuacion.use-case';
import { goldenScores } from './golden-scores';

function crearNivelParaGolden(g: (typeof goldenScores)[number]): Nivel {
  const celdas = [
    [
      FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
      FabricaCeldasEstandar.crearVacia(),
    ],
  ];
  const definicion = DefinicionTablero.crear(2, 1, celdas);
  return Nivel.crear({
    id: `nivel-${g.nombre}`,
    nombre: g.nombre,
    dificultad: 'FACIL',
    definicionTablero: definicion,
    ancho: 1,
    alto: 1,
    baseNivel: g.baseNivel,
    kmov: g.kmov,
    ktiempo: g.ktiempo,
    umbralEstrella1: g.umbralEstrella1,
    umbralEstrella2: g.umbralEstrella2,
    umbralEstrella3: g.umbralEstrella3,
    limiteTiempo: g.limiteTiempo,
  });
}

describe('Golden scores agreement', () => {
  const casoDeUso = new CalcularPuntuacionCasoDeUso();

  goldenScores.forEach((g) => {
    it(`matches golden fixture "${g.nombre}"`, () => {
      const nivel = crearNivelParaGolden(g);
      const resultado = casoDeUso.ejecutar({
        nivel,
        movimientos: g.movimientos,
        segundosRestantes: g.segundosRestantes,
      });

      expect(resultado.puntaje).toBe(g.esperadoPuntaje);
      expect(resultado.estrellas).toBe(g.esperadoEstrellas);
    });
  });
});
