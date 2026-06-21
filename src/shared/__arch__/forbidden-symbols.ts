/**
 * ADR-0004: framework coupling (NestJS, RxJS, Prisma) and infrastructure concerns
 * (hashing, logging, metrics libraries) are confined to the outer ring. Domain and
 * application stay framework-free by depending on ports, never on concretes.
 */
export const FRAMEWORK_FORBIDDEN_IMPORT_PREFIXES: readonly string[] = [
  '@nestjs/',
  '@prisma/client',
  'bcrypt',
  'rxjs',
  'winston',
  'pino',
  '@sentry/',
  'prom-client',
  // Node runtime primitive: identity generation (randomUUID) is reached through the
  // IGeneradorId port; the only sanctioned `crypto` import is CryptoGeneradorIdAdapter,
  // which lives in infrastructure and is not scanned by the domain/application guards.
  'crypto',
];

/**
 * PRD §4 avoid-list (code-level subset) — terms whose presence as a symbol signals a
 * design the PRD explicitly rejected. Rationale per PRD §4 / §9:
 * - CeldaSalida: the board has exactly four Celda kinds via FabricaCeldasEstandar
 *   (CeldaFlecha, CeldaPared, CeldaVacia, Coleccionable); no exit-tile subtype.
 * - Composite: no Composite board structure — Tablero is a port, GrafoTablero the
 *   incremental implementation detail (out of scope, see PRD "Explicitly out of scope").
 * - NivelFacil / NivelMedio / NivelDificil: difficulty is data (enum + definition),
 *   never a subtype.
 * - PuntuacionPorTiempo: only PuntuacionMixta (timed) and PuntuacionPorMovimientos
 *   (untimed) strategies exist (PRD D2).
 * - CargadorNiveles: the loader is singular per ubiquitous language (plural banned).
 */
export const AVOID_LIST_EXACT_IDENTIFIERS: readonly string[] = [
  'CeldaSalida',
  'Composite',
  'NivelFacil',
  'NivelMedio',
  'NivelDificil',
  'PuntuacionPorTiempo',
  'CargadorNiveles',
];

/**
 * "Cell decorators" (PRD §4): the Decorator pattern must never be applied to Celda —
 * the four Celda kinds are produced directly by FabricaCeldasEstandar.
 */
export function isCellDecoratorIdentifier(token: string): boolean {
  return token.includes('Celda') && token.includes('Decorator');
}
