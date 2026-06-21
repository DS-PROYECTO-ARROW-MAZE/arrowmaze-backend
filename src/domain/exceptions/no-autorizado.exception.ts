export class NoAutorizadoException extends Error {
  constructor() {
    super('No autorizado');
    this.name = 'NoAutorizadoException';
  }
}
