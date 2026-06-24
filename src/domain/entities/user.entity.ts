import { AggregateRoot } from '../stereotypes/aggregate-root';
import { JugadorRegistradoEvent } from '../events/jugador-registrado.event';

export class User extends AggregateRoot {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public passwordHash: string,
    public readonly createdAt: Date,
  ) {
    super();
  }

  // The plain constructor stays event-free (mappers use it to rehydrate existing rows);
  // only this factory represents a brand-new registration and records the domain event.
  static registrar(
    id: string,
    email: string,
    passwordHash: string,
    createdAt: Date,
  ): User {
    const usuario = new User(id, email, passwordHash, createdAt);
    usuario.addDomainEvent(new JugadorRegistradoEvent(id, email));
    return usuario;
  }
}
