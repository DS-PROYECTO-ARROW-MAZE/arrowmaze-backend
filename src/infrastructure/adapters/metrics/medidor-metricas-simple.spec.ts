import { MedidorMetricasSimple } from './medidor-metricas-simple';

describe('MedidorMetricasSimple', () => {
  it('should_log_the_use_case_name_and_duration_when_registrarDuracion_is_called', () => {
    // Arrange
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const medidor = new MedidorMetricasSimple();

    // Act
    medidor.registrarDuracion('CrearNivel', 42);

    // Assert
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('CrearNivel'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('42'));
    logSpy.mockRestore();
  });
});
