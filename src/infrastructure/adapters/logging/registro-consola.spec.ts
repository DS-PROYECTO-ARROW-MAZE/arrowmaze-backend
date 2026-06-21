import { RegistroConsola } from './registro-consola';

describe('RegistroConsola', () => {
  it('should_log_the_message_when_info_is_called', () => {
    // Arrange
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const registro = new RegistroConsola();

    // Act
    registro.info('CrearNivel: inicio');

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('CrearNivel: inicio'),
    );
    logSpy.mockRestore();
  });
});
