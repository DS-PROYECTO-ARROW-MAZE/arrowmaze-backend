import { ICasoDeUso } from '../ports/caso-de-uso.interface';
import { IMedidorMetricas } from '../ports/medidor-metricas.port';
import { DecoradorCasoDeUso } from './decorador-caso-de-uso';

export class DecoradorMetricas<E, S> extends DecoradorCasoDeUso<E, S> {
  constructor(
    casoDeUso: ICasoDeUso<E, S>,
    private readonly medidorMetricas: IMedidorMetricas,
    private readonly nombreCasoDeUso: string,
  ) {
    super(casoDeUso);
  }

  async execute(entrada: E): Promise<S> {
    const inicio = Date.now();
    try {
      return await super.execute(entrada);
    } finally {
      this.medidorMetricas.registrarDuracion(
        this.nombreCasoDeUso,
        Date.now() - inicio,
      );
    }
  }
}
