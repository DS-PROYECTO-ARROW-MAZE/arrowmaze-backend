import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

class EventoDePrueba extends DomainEvent {
  constructor(public readonly dato: string) {
    super();
  }
}

class AgregadoDePrueba extends AggregateRoot {
  registrarEvento(dato: string): void {
    this.addDomainEvent(new EventoDePrueba(dato));
  }
}

describe('AggregateRoot', () => {
  it('should_have_no_domain_events_when_just_constructed', () => {
    // Arrange
    const agregado = new AgregadoDePrueba();

    // Act & Assert
    expect(agregado.domainEvents).toEqual([]);
  });

  it('should_record_a_domain_event_when_addDomainEvent_is_called', () => {
    // Arrange
    const agregado = new AgregadoDePrueba();

    // Act
    agregado.registrarEvento('uno');

    // Assert
    expect(agregado.domainEvents).toHaveLength(1);
    expect(agregado.domainEvents[0]).toBeInstanceOf(EventoDePrueba);
  });

  it('should_preserve_recording_order_when_multiple_events_are_added', () => {
    // Arrange
    const agregado = new AgregadoDePrueba();

    // Act
    agregado.registrarEvento('uno');
    agregado.registrarEvento('dos');

    // Assert
    const datos = agregado.domainEvents.map((e) => (e as EventoDePrueba).dato);
    expect(datos).toEqual(['uno', 'dos']);
  });

  it('should_empty_domain_events_when_clearEvents_is_called', () => {
    // Arrange
    const agregado = new AgregadoDePrueba();
    agregado.registrarEvento('uno');

    // Act
    agregado.clearEvents();

    // Assert
    expect(agregado.domainEvents).toEqual([]);
  });
});
