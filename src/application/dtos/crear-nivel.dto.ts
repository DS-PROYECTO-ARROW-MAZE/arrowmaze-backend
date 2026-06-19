export interface CeldaDto {
  tipo: 'flecha' | 'pared' | 'vacia' | 'coleccionable';
  direccion?: string;
}

export interface CrearNivelDto {
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

export interface CrearNivelResultadoDto {
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
