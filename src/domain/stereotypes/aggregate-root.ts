import { DomainEvent } from './domain-event';

export abstract class AggregateRoot {
  private eventosDeDominio: DomainEvent[] = [];

  protected addDomainEvent(evento: DomainEvent): void {
    this.eventosDeDominio.push(evento);
  }

  get domainEvents(): readonly DomainEvent[] {
    return [...this.eventosDeDominio];
  }

  clearEvents(): void {
    this.eventosDeDominio = [];
  }
}
