import { ICasoDeUso } from '../ports/caso-de-uso.interface';
import { DecoradorCasoDeUso } from './decorador-caso-de-uso';

class DecoradorDePrueba<E, S> extends DecoradorCasoDeUso<E, S> {
  // Public constructor so the test can instantiate the double; the base keeps its
  // protected constructor (only subclasses/decorators may wrap a use case).
  constructor(casoDeUso: ICasoDeUso<E, S>) {
    super(casoDeUso);
  }
}

describe('DecoradorCasoDeUso', () => {
  it('should_return_the_same_result_as_the_wrapped_use_case_when_no_behaviour_is_added', async () => {
    // Arrange
    const resultadoEsperado = { ok: true };
    const casoDeUsoBase: ICasoDeUso<string, { ok: boolean }> = {
      execute: jest.fn().mockResolvedValue(resultadoEsperado),
    };
    const decorador = new DecoradorDePrueba(casoDeUsoBase);

    // Act
    const resultado = await decorador.execute('entrada');

    // Assert
    expect(resultado).toBe(resultadoEsperado);
    expect(casoDeUsoBase.execute).toHaveBeenCalledWith('entrada');
  });
});
