export class NivelNoEncontradoException extends Error {
  constructor(id: string) {
    super(`Nivel con id ${id} no encontrado`);
    this.name = 'NivelNoEncontradoException';
  }
}
