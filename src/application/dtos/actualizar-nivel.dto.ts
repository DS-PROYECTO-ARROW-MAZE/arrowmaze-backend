import { CeldaDto } from './crear-nivel.dto';

export interface ActualizarNivelDto {
  nombre: string;
  dificultad: string;
  ancho: number;
  alto: number;
  celdas: CeldaDto[][];
  baseNivel: number;
  kmov: number;
  ktiempo: number;
  umbralEstrella1: number;
  umbralEstrella2: number;
  umbralEstrella3: number;
  limiteTiempo?: number;
}

export interface ActualizarNivelResultadoDto {
  id: string;
  nombre: string;
  dificultad: string;
  ancho: number;
  alto: number;
  baseNivel: number;
  kmov: number;
  ktiempo: number;
  umbralEstrella1: number;
  umbralEstrella2: number;
  umbralEstrella3: number;
  limiteTiempo?: number;
}
