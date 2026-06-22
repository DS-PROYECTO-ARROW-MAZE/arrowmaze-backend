// Catalog summary for a single level (Ticket 16, story C2′). Deliberately omits the board
// `celdas` matrix — clients fetch the full board on demand via GET /levels/:id (ticket 04).
// `id` is included so the client can issue that per-level fetch.
export interface NivelResumenDto {
  id: string;
  numero: number;
  nombre: string;
  dificultad: string;
  esBonus: boolean;
  ancho: number;
  alto: number;
}
