import { ICasoDeUso } from '../ports/caso-de-uso.interface';
import { IMedidorMetricas } from '../ports/medidor-metricas.port';
import { DecoradorMetricas } from './decorador-metricas';

describe('DecoradorMetricas', () => {
  it('should_return_the_wrapped_result_when_execute_succeeds', async () => {
    // Arrange
    const casoDeUsoBase: ICasoDeUso<string, string> = {
      execute: jest.fn().mockResolvedValue('ok'),
    };
    const medidorMetricas: IMedidorMetricas = {
      registrarDuracion: jest.fn(),
    };
    const decorador = new DecoradorMetricas(
      casoDeUsoBase,
      medidorMetricas,
      'CasoDePrueba',
    );

    // Act
    const resultado = await decorador.execute('entrada');

    // Assert
    expect(resultado).toBe('ok');
    expect(casoDeUsoBase.execute).toHaveBeenCalledWith('entrada');
  });

  it('should_record_a_duration_in_the_medidor_metricas_when_execute_finishes', async () => {
    // Arrange
    const casoDeUsoBase: ICasoDeUso<string, string> = {
      execute: jest.fn().mockResolvedValue('ok'),
    };
    const registrarDuracionMock = jest.fn();
    const medidorMetricas: IMedidorMetricas = {
      registrarDuracion: registrarDuracionMock,
    };
    const decorador = new DecoradorMetricas(
      casoDeUsoBase,
      medidorMetricas,
      'CasoDePrueba',
    );

    // Act
    await decorador.execute('entrada');

    // Assert
    expect(registrarDuracionMock).toHaveBeenCalledWith(
      'CasoDePrueba',
      expect.any(Number),
    );
  });

  it('should_record_a_duration_even_when_the_wrapped_use_case_throws', async () => {
    // Arrange
    const error = new Error('boom');
    const casoDeUsoBase: ICasoDeUso<string, string> = {
      execute: jest.fn().mockRejectedValue(error),
    };
    const registrarDuracionMock = jest.fn();
    const medidorMetricas: IMedidorMetricas = {
      registrarDuracion: registrarDuracionMock,
    };
    const decorador = new DecoradorMetricas(
      casoDeUsoBase,
      medidorMetricas,
      'CasoDePrueba',
    );

    // Act & Assert
    await expect(decorador.execute('entrada')).rejects.toThrow(error);
    expect(registrarDuracionMock).toHaveBeenCalledWith(
      'CasoDePrueba',
      expect.any(Number),
    );
  });
});
