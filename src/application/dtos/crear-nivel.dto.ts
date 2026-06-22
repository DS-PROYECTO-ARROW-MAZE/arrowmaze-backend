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
  // Ordinal that fixes play order and gates the timed rule (PRD §3). Optional at the API:
  // when omitted the domain derives a value consistent with limiteTiempo.
  numero?: number;
  // Bonus levels are non-scoring and exempt from the timed rule.
  esBonus?: boolean;
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
  numero: number;
  esBonus: boolean;
}
