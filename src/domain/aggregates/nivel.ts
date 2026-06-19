import { randomUUID } from 'crypto';
import { DefinicionTablero } from '../value-objects/definicion-tablero';

export interface CrearNivelParams {
  nombre: string;
  dificultad: string;
  definicionTablero: DefinicionTablero;
  ancho: number;
  alto: number;
  baseNivel: number;
  kmov: number;
  ktiempo: number;
  umbralEstrella1: number;
  umbralEstrella2: number;
  umbralEstrella3: number;
  limiteTiempo?: number;
  id?: string;
}

export class Nivel {
  private constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly dificultad: string,
    public readonly definicionTablero: DefinicionTablero,
    public readonly ancho: number,
    public readonly alto: number,
    public readonly baseNivel: number,
    public readonly kmov: number,
    public readonly ktiempo: number,
    public readonly umbralEstrella1: number,
    public readonly umbralEstrella2: number,
    public readonly umbralEstrella3: number,
    public readonly limiteTiempo?: number,
  ) {}

  static crear(params: CrearNivelParams): Nivel {
    return new Nivel(
      params.id ?? randomUUID(),
      params.nombre,
      params.dificultad,
      params.definicionTablero,
      params.ancho,
      params.alto,
      params.baseNivel,
      params.kmov,
      params.ktiempo,
      params.umbralEstrella1,
      params.umbralEstrella2,
      params.umbralEstrella3,
      params.limiteTiempo,
    );
  }
}
