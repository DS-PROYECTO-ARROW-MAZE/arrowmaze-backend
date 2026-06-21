import { Test } from '@nestjs/testing';
import { CrearNivelCasoDeUso } from '../../application/use-cases/crear-nivel.use-case';
import {
  IRepositorioNivel,
  NIVEL_REPOSITORY,
} from '../../domain/repositories/nivel.repository.interface';
import {
  I_MEDIDOR_METRICAS,
  IMedidorMetricas,
} from '../../application/ports/medidor-metricas.port';
import { I_REGISTRO, IRegistro } from '../../application/ports/registro.port';
import {
  I_PROVEEDOR_SESION,
  IProveedorSesion,
} from '../../application/ports/proveedor-sesion.port';
import { ICasoDeUso } from '../../application/ports/caso-de-uso.interface';
import {
  IGeneradorId,
  I_GENERADOR_ID,
} from '../../application/ports/generador-id.port';
import {
  CrearNivelDto,
  CrearNivelResultadoDto,
} from '../../application/dtos/crear-nivel.dto';
import { DecoradorMetricas } from '../../application/decorators/decorador-metricas';
import { DecoradorRegistro } from '../../application/decorators/decorador-registro';
import { DecoradorSeguridad } from '../../application/decorators/decorador-seguridad';
import { NoAutorizadoException } from '../../domain/exceptions/no-autorizado.exception';

const CASO_DE_USO_CREAR_NIVEL_DECORADO = 'CasoDeUsoCrearNivelDecorado';

const dtoValido: CrearNivelDto = {
  nombre: 'Mi Nivel',
  dificultad: 'FACIL',
  ancho: 1,
  alto: 1,
  celdas: [[{ tipo: 'flecha', direccion: 'DERECHA' }]],
  baseNivel: 1000,
  kmov: 10,
  ktiempo: 5,
  umbralEstrella1: 800,
  umbralEstrella2: 600,
  umbralEstrella3: 400,
};

// Composes the stack in the order the ticket requires: Seguridad wraps Registro wraps
// Metricas wraps the bare use case, so security runs first and metrics closest to it.
function proveerCasoDeUsoDecorado(
  casoDeUso: CrearNivelCasoDeUso,
  medidorMetricas: IMedidorMetricas,
  registro: IRegistro,
  proveedorSesion: IProveedorSesion,
): ICasoDeUso<CrearNivelDto, CrearNivelResultadoDto> {
  const conMetricas = new DecoradorMetricas(
    casoDeUso,
    medidorMetricas,
    'CrearNivel',
  );
  const conRegistro = new DecoradorRegistro(
    conMetricas,
    registro,
    'CrearNivel',
  );
  return new DecoradorSeguridad(conRegistro, proveedorSesion);
}

async function compilarModuloDePrueba(proveedorSesion: IProveedorSesion) {
  const repositorioFalso: IRepositorioNivel = {
    guardar: jest.fn().mockResolvedValue(undefined),
    obtenerPorId: jest.fn(),
  };
  const ordenDeLlamadas: string[] = [];
  const medidorMetricas: IMedidorMetricas = {
    registrarDuracion: jest.fn(() => ordenDeLlamadas.push('metricas')),
  };
  const registro: IRegistro = {
    info: jest.fn((mensaje: string) =>
      ordenDeLlamadas.push(`registro:${mensaje}`),
    ),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      { provide: NIVEL_REPOSITORY, useValue: repositorioFalso },
      { provide: I_MEDIDOR_METRICAS, useValue: medidorMetricas },
      { provide: I_REGISTRO, useValue: registro },
      { provide: I_PROVEEDOR_SESION, useValue: proveedorSesion },
      {
        provide: I_GENERADOR_ID,
        useValue: { generar: () => 'nivel-generado-test' } as IGeneradorId,
      },
      {
        provide: CrearNivelCasoDeUso,
        useFactory: (repo: IRepositorioNivel, generadorId: IGeneradorId) =>
          new CrearNivelCasoDeUso(repo, generadorId),
        inject: [NIVEL_REPOSITORY, I_GENERADOR_ID],
      },
      {
        provide: CASO_DE_USO_CREAR_NIVEL_DECORADO,
        useFactory: proveerCasoDeUsoDecorado,
        inject: [
          CrearNivelCasoDeUso,
          I_MEDIDOR_METRICAS,
          I_REGISTRO,
          I_PROVEEDOR_SESION,
        ],
      },
    ],
  }).compile();

  return { moduleRef, repositorioFalso, ordenDeLlamadas };
}

describe('Composition wiring: Seguridad -> Registro -> Metricas -> CrearNivelCasoDeUso', () => {
  it('should_return_the_same_result_as_the_bare_use_case_when_resolved_from_the_nest_container', async () => {
    // Arrange
    const proveedorSesion: IProveedorSesion = {
      guardarToken: jest.fn(),
      establecerPrincipal: jest.fn(),
      obtenerToken: jest.fn(),
      obtenerPrincipal: jest
        .fn()
        .mockReturnValue({ id: 'user-id', email: 'jac@test.com' }),
      cerrarSesion: jest.fn(),
    };
    const { moduleRef, repositorioFalso } =
      await compilarModuloDePrueba(proveedorSesion);
    const casoDeUsoBase = moduleRef.get(CrearNivelCasoDeUso);
    const casoDeUsoDecorado = moduleRef.get<
      ICasoDeUso<CrearNivelDto, CrearNivelResultadoDto>
    >(CASO_DE_USO_CREAR_NIVEL_DECORADO);

    // Act
    const resultadoBase = await casoDeUsoBase.execute(dtoValido);
    const resultadoDecorado = await casoDeUsoDecorado.execute(dtoValido);

    // Assert
    expect(resultadoDecorado.nombre).toBe(resultadoBase.nombre);
    expect(resultadoDecorado.dificultad).toBe(resultadoBase.dificultad);
    expect(repositorioFalso.guardar).toHaveBeenCalledTimes(2);
  });

  it('should_run_seguridad_then_registro_then_metricas_then_the_use_case_in_order', async () => {
    // Arrange
    const proveedorSesion: IProveedorSesion = {
      guardarToken: jest.fn(),
      establecerPrincipal: jest.fn(),
      obtenerToken: jest.fn(),
      obtenerPrincipal: jest
        .fn()
        .mockReturnValue({ id: 'user-id', email: 'jac@test.com' }),
      cerrarSesion: jest.fn(),
    };
    const { moduleRef, ordenDeLlamadas } =
      await compilarModuloDePrueba(proveedorSesion);
    const casoDeUsoDecorado = moduleRef.get<
      ICasoDeUso<CrearNivelDto, CrearNivelResultadoDto>
    >(CASO_DE_USO_CREAR_NIVEL_DECORADO);

    // Act
    await casoDeUsoDecorado.execute(dtoValido);

    // Assert — Registro (outer) logs straddle Metricas (inner), which records once the
    // base use case returns: inicio -> metricas -> fin.
    expect(ordenDeLlamadas).toEqual([
      'registro:CrearNivel: inicio',
      'metricas',
      'registro:CrearNivel: fin',
    ]);
    expect(proveedorSesion.obtenerPrincipal).toHaveBeenCalledTimes(1);
  });

  it('should_block_execute_before_reaching_registro_or_metricas_when_the_session_has_no_principal', async () => {
    // Arrange
    const proveedorSesion: IProveedorSesion = {
      guardarToken: jest.fn(),
      establecerPrincipal: jest.fn(),
      obtenerToken: jest.fn(),
      obtenerPrincipal: jest.fn().mockReturnValue(null),
      cerrarSesion: jest.fn(),
    };
    const { moduleRef, ordenDeLlamadas, repositorioFalso } =
      await compilarModuloDePrueba(proveedorSesion);
    const casoDeUsoDecorado = moduleRef.get<
      ICasoDeUso<CrearNivelDto, CrearNivelResultadoDto>
    >(CASO_DE_USO_CREAR_NIVEL_DECORADO);

    // Act & Assert
    await expect(casoDeUsoDecorado.execute(dtoValido)).rejects.toBeInstanceOf(
      NoAutorizadoException,
    );
    expect(ordenDeLlamadas).toEqual([]);
    expect(repositorioFalso.guardar).not.toHaveBeenCalled();
  });
});
