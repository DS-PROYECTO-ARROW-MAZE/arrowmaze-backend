import { DomainEvent } from '../stereotypes/domain-event';

export class JugadorRegistradoEvent extends DomainEvent {
  constructor(
    public readonly id: string,
    public readonly email: string,
  ) {
    super();
  }
}
