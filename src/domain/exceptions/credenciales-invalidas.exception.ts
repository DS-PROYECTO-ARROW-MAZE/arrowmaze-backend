export class CredencialesInvalidasException extends Error {
  constructor() {
    super('Credenciales inválidas');
    this.name = 'CredencialesInvalidasException';
  }
}
