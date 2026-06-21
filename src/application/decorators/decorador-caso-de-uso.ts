import { ICasoDeUso } from '../ports/caso-de-uso.interface';

export abstract class DecoradorCasoDeUso<E, S> implements ICasoDeUso<E, S> {
  protected constructor(protected readonly casoDeUso: ICasoDeUso<E, S>) {}

  execute(entrada: E): Promise<S> {
    return this.casoDeUso.execute(entrada);
  }
}
