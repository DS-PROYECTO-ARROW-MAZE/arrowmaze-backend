import { ICasoDeUso } from '../ports/caso-de-uso.interface';
import { IRegistro } from '../ports/registro.port';
import { DecoradorCasoDeUso } from './decorador-caso-de-uso';

export class DecoradorRegistro<E, S> extends DecoradorCasoDeUso<E, S> {
  constructor(
    casoDeUso: ICasoDeUso<E, S>,
    private readonly registro: IRegistro,
    private readonly nombreCasoDeUso: string,
  ) {
    super(casoDeUso);
  }

  async execute(entrada: E): Promise<S> {
    this.registro.info(`${this.nombreCasoDeUso}: inicio`);
    const resultado = await super.execute(entrada);
    this.registro.info(`${this.nombreCasoDeUso}: fin`);
    return resultado;
  }
}
