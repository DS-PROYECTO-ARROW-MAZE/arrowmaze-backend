export interface CeldaDto {
  // 'ausente' marks a position outside the playable region of a shaped board. Shaped
  // boards are expressed by including absent cells in the grid; on serve they round-trip
  // back as 'ausente'.
  tipo: 'flecha' | 'pared' | 'vacia' | 'coleccionable' | 'ausente';
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
