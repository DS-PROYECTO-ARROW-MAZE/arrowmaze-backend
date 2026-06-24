export class EmailYaRegistradoException extends Error {
  constructor(email: string) {
    super(`El email ${email} ya está registrado en ArrowMaze`);
    this.name = 'EmailYaRegistradoException';
  }
}
