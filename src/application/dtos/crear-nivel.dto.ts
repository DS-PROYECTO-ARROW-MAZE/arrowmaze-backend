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
  // Depth axis ("capa" count). Optional at the API: when omitted the board is a single
  // layer (2D), preserving every pre-ticket-19 caller. celdas indexes as [z][y][x] when
  // profundo > 1 (or a plain [y][x] matrix for the 2D, profundo-omitted case).
  profundo?: number;
  celdas: CeldaDto[][] | CeldaDto[][][];
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
  profundo: number;
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
