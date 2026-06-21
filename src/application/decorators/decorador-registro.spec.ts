import { ICasoDeUso } from '../ports/caso-de-uso.interface';
import { IRegistro } from '../ports/registro.port';
import { DecoradorRegistro } from './decorador-registro';

describe('DecoradorRegistro', () => {
  it('should_return_the_wrapped_result_when_execute_succeeds', async () => {
    // Arrange
    const casoDeUsoBase: ICasoDeUso<string, string> = {
      execute: jest.fn().mockResolvedValue('ok'),
    };
    const registro: IRegistro = { info: jest.fn() };
    const decorador = new DecoradorRegistro(
      casoDeUsoBase,
      registro,
      'CasoDePrueba',
    );

    // Act
    const resultado = await decorador.execute('entrada');

    // Assert
    expect(resultado).toBe('ok');
  });

  it('should_log_start_and_finish_around_the_wrapped_execution_in_order', async () => {
    // Arrange
    const ordenDeLlamadas: string[] = [];
    const casoDeUsoBase: ICasoDeUso<string, string> = {
      execute: jest.fn(() => {
        ordenDeLlamadas.push('execute');
        return Promise.resolve('ok');
      }),
    };
    const registro: IRegistro = {
      info: jest.fn((mensaje: string) => ordenDeLlamadas.push(mensaje)),
    };
    const decorador = new DecoradorRegistro(
      casoDeUsoBase,
      registro,
      'CasoDePrueba',
    );

    // Act
    await decorador.execute('entrada');

    // Assert
    expect(ordenDeLlamadas).toEqual([
      'CasoDePrueba: inicio',
      'execute',
      'CasoDePrueba: fin',
    ]);
  });
});
