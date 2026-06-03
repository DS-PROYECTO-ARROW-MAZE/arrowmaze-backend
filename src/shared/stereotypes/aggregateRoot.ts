import { DomainEvent } from "./domainEvent";
import { Entity } from "./entity";
// AggregateRoot.ts
/**
 * Clase base para el Agregado Raíz.
 * Extiende de Entity y añade la capacidad de manejar Eventos de Dominio.
 */
export abstract class AggregateRoot<T> extends Entity<T> {
    // Aquí almacenaríamos eventos como "UsuarioCreado", "PedidoCancelado", etc.
    private _domainEvents: DomainEvent[] = [];

    get domainEvents(): DomainEvent[] {
        return this._domainEvents;
    }

    /**
     * Registra un nuevo evento de dominio que ocurrió dentro de este agregado.
     */
    protected addDomainEvent(domainEvent: DomainEvent): void {
        this._domainEvents.push(domainEvent);
        console.log(`[Domain Event Registrado]:`, domainEvent.constructor.name);
    }

    /**
     * Limpia los eventos una vez que han sido procesados/despachados.
     */
    public clearEvents(): void {
        this._domainEvents = [];
    }
}

//Ejemplo
/*
interface UserProps {
  name: string;
  email: string;
  address: Address; // Utilizamos el Value Object dentro de la Entidad
  isActive: boolean;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  public static create(props: UserProps, id?: string): User {
    const user = new User({
      ...props,
      isActive: props.isActive ?? true // Lógica de negocio por defecto
    }, id);

   // Instanciamos y registramos nuestro evento de dominio real
    user.addDomainEvent(new UserCreatedEvent(user.id, props.email))

    return user;
  }

  // Comportamiento del dominio
  public changeAddress(newAddress: Address): void {
    this.props.address = newAddress;
    this.addDomainEvent({ type: 'USER_ADDRESS_CHANGED', userId: this.id });
  }
}
  */