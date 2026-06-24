export const I_GENERADOR_ID = 'IGeneradorId';

/**
 * ADR-0004 / domain-purity: identity is minted through this injected port so the domain
 * stays pure TypeScript (no Node `crypto`) and entity factories stay deterministic under
 * test. The application layer assigns the id and hands it to the domain factory; the
 * concrete UUID source lives in `infrastructure/adapters/identity`.
 */
export interface IGeneradorId {
  generar(): string;
}
