import { User } from './user.entity';
import { JugadorRegistradoEvent } from '../events/jugador-registrado.event';

describe('User', () => {
  describe('registrar', () => {
    it('should_record_exactly_one_JugadorRegistradoEvent_when_a_player_registers', () => {
      // Arrange
      const id = 'user-id';
      const email = 'jac@test.com';
      const passwordHash = 'hashed:secreta123';
      const createdAt = new Date();

      // Act
      const usuario = User.registrar(id, email, passwordHash, createdAt);

      // Assert
      expect(usuario.domainEvents).toHaveLength(1);
      const evento = usuario.domainEvents[0] as JugadorRegistradoEvent;
      expect(evento).toBeInstanceOf(JugadorRegistradoEvent);
      expect(evento.id).toBe(id);
      expect(evento.email).toBe(email);
      expect(evento).not.toHaveProperty('passwordHash');
      expect(evento).not.toHaveProperty('password');
    });

    it('should_empty_the_domain_events_when_clearEvents_is_called', () => {
      // Arrange
      const usuario = User.registrar(
        'user-id',
        'jac@test.com',
        'hashed:secreta123',
        new Date(),
      );

      // Act
      usuario.clearEvents();

      // Assert
      expect(usuario.domainEvents).toEqual([]);
    });
  });

  describe('constructor', () => {
    it('should_record_no_domain_events_when_reconstructed_from_persistence', () => {
      // Arrange & Act — the plain constructor is what mappers use to rehydrate an
      // existing row; it must never re-fire a "player registered" event.
      const usuario = new User(
        'user-id',
        'jac@test.com',
        'hashed:secreta123',
        new Date(),
      );

      // Assert
      expect(usuario.domainEvents).toEqual([]);
    });
  });
});
