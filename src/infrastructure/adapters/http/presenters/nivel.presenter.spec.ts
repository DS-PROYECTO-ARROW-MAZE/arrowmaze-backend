import { NivelPresenter } from './nivel.presenter';
import { Nivel } from '../../../../domain/aggregates/nivel';
import { DefinicionTablero } from '../../../../domain/value-objects/definicion-tablero';
import { FabricaCeldasEstandar } from '../../../../domain/value-objects/celda';
import { Direccion } from '../../../../domain/value-objects/direccion';

describe('NivelPresenter', () => {
  const nivel = Nivel.crear({
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Nivel Test',
    dificultad: 'FACIL',
    definicionTablero: DefinicionTablero.restaurar(1, 1, [
      [FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)],
    ]),
    ancho: 1,
    alto: 1,
    baseNivel: 1000,
    kmov: 10,
    ktiempo: 5,
    umbralEstrella1: 800,
    umbralEstrella2: 600,
    umbralEstrella3: 400,
  });

  const nivelConTiempo = Nivel.crear({
    id: '00000000-0000-0000-0000-000000000002',
    nombre: 'Nivel Con Tiempo',
    dificultad: 'DIFICIL',
    definicionTablero: DefinicionTablero.restaurar(1, 1, [
      [FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA)],
    ]),
    ancho: 1,
    alto: 1,
    baseNivel: 2000,
    kmov: 5,
    ktiempo: 10,
    umbralEstrella1: 900,
    umbralEstrella2: 700,
    umbralEstrella3: 500,
    limiteTiempo: 30,
  });

  it('should_map_Nivel_to_DefinicionNivelDto_with_stable_field_names_when_toDto_is_called', () => {
    const dto = NivelPresenter.toDto(nivel);

    expect(dto.id).toBe('00000000-0000-0000-0000-000000000001');
    expect(dto.nombre).toBe('Nivel Test');
    expect(dto.dificultad).toBe('FACIL');
    expect(dto.ancho).toBe(1);
    expect(dto.alto).toBe(1);
    expect(dto.baseNivel).toBe(1000);
    expect(dto.kmov).toBe(10);
    expect(dto.ktiempo).toBe(5);
    expect(dto.umbralEstrella1).toBe(800);
    expect(dto.umbralEstrella2).toBe(600);
    expect(dto.umbralEstrella3).toBe(400);
    expect(dto.limiteTiempo).toBeUndefined();
  });

  it('should_include_celdas_in_the_mapped_DTO_when_toDto_is_called', () => {
    const dto = NivelPresenter.toDto(nivel);

    expect(dto.celdas).toEqual([[{ tipo: 'flecha', direccion: 'DERECHA' }]]);
  });

  it('should_map_limiteTiempo_when_present', () => {
    const dto = NivelPresenter.toDto(nivelConTiempo);

    expect(dto.limiteTiempo).toBe(30);
    expect(dto.ktiempo).toBe(10);
    expect(dto.kmov).toBe(5);
  });

  it('should_not_leak_domain_types_in_the_output_when_toDto_is_called', () => {
    const dto = NivelPresenter.toDto(nivel);

    expect(dto).not.toBeInstanceOf(Nivel);
    for (const fila of dto.celdas) {
      for (const celda of fila) {
        expect(typeof celda.tipo).toBe('string');
      }
    }
  });

  it('should_map_all_cell_types_correctly_when_toDto_is_called', () => {
    const nivelVariado = Nivel.crear({
      id: '00000000-0000-0000-0000-000000000003',
      nombre: 'Variado',
      dificultad: 'MEDIO',
      definicionTablero: DefinicionTablero.restaurar(2, 2, [
        [
          FabricaCeldasEstandar.crearFlecha(Direccion.DERECHA),
          FabricaCeldasEstandar.crearPared(),
        ],
        [
          FabricaCeldasEstandar.crearVacia(),
          FabricaCeldasEstandar.crearColeccionable(),
        ],
      ]),
      ancho: 2,
      alto: 2,
      baseNivel: 1000,
      kmov: 10,
      ktiempo: 5,
      umbralEstrella1: 800,
      umbralEstrella2: 600,
      umbralEstrella3: 400,
    });

    const dto = NivelPresenter.toDto(nivelVariado);

    expect(dto.celdas).toEqual([
      [{ tipo: 'flecha', direccion: 'DERECHA' }, { tipo: 'pared' }],
      [{ tipo: 'vacia' }, { tipo: 'coleccionable' }],
    ]);
  });
});
