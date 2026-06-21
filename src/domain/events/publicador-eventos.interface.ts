import { DomainEvent } from '../stereotypes/domain-event';

export const I_PUBLICADOR_EVENTOS = 'IPublicadorEventos';

// Backend's own domain-events publisher (PRD §6.2 DM-B7) — explicitly distinct from the
// frontend PublicadorEventosJuego (GoF Observer over gameplay events). Dispatch/transport
// stays hidden behind this port; domain/application never know how events are delivered.
export interface IPublicadorEventos {
  publicar(eventos: readonly DomainEvent[]): Promise<void>;
}
