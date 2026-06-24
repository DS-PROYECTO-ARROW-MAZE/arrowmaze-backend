import { Injectable } from '@nestjs/common';
import { IRegistro } from '../../../application/ports/registro.port';

@Injectable()
export class RegistroConsola implements IRegistro {
  info(mensaje: string): void {
    console.log(`[registro] ${mensaje}`);
  }
}
