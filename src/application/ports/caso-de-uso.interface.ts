export interface ICasoDeUso<E, S> {
  execute(entrada: E): Promise<S>;
}
