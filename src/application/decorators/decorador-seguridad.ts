import { ICasoDeUso } from '../ports/caso-de-uso.interface';
import { IProveedorSesion } from '../ports/proveedor-sesion.port';
import { NoAutorizadoException } from '../../domain/exceptions/no-autorizado.exception';
import { DecoradorCasoDeUso } from './decorador-caso-de-uso';

// ADR-0002: the principal is read exclusively through the injected ProveedorSesion
// port — never a static/global accessor — so this decorator stays unit-testable and
// request-isolated.
export class DecoradorSeguridad<E, S> extends DecoradorCasoDeUso<E, S> {
  constructor(
    casoDeUso: ICasoDeUso<E, S>,
    private readonly proveedorSesion: IProveedorSesion,
  ) {
    super(casoDeUso);
  }

  async execute(entrada: E): Promise<S> {
    if (!this.proveedorSesion.obtenerPrincipal()) {
      throw new NoAutorizadoException();
    }
    return super.execute(entrada);
  }
}
