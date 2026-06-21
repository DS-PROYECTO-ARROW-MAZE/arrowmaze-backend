import { DomainEvent } from '../../../domain/stereotypes/domain-event';
import { PublicadorEventosAdapter } from './publicador-eventos.adapter';

class EventoDePrueba extends DomainEvent {
  constructor(public readonly dato: string) {
    super();
  }
}

describe('PublicadorEventosAdapter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should_dispatch_each_event_to_the_transport_in_order_when_publicar_is_called', async () => {
    // Arrange
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const adapter = new PublicadorEventosAdapter();
    const eventos = [new EventoDePrueba('uno'), new EventoDePrueba('dos')];

    // Act
    await adapter.publicar(eventos);

    // Assert — dispatched in the same order they were recorded.
    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('EventoDePrueba'),
      eventos[0],
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('EventoDePrueba'),
      eventos[1],
    );
  });

  it('should_dispatch_nothing_when_publicar_is_called_with_no_events', async () => {
    // Arrange
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const adapter = new PublicadorEventosAdapter();

    // Act
    await adapter.publicar([]);

    // Assert
    expect(logSpy).not.toHaveBeenCalled();
  });
});
