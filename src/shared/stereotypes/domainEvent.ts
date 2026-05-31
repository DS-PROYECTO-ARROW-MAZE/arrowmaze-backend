//DomainEvent.ts
/**
 * Clase base para los Eventos de Dominio.
 * Todo evento debe extender de esta clase para garantizar que registre
 * cuándo ocurrió y permita identificar de qué evento se trata.
 */
export abstract class DomainEvent {
    // La fecha y hora exactas en que ocurrió el evento.
    public readonly occurredOn: Date;

    constructor() {
        // Al instanciar el evento, capturamos automáticamente el momento actual.
        this.occurredOn = new Date();
    }

    /**
     * Método útil para obtener el nombre de la clase del evento (ej. "UserCreated").
     * Esto facilita la creación de "manejadores" (handlers) o el enrutamiento de eventos
     * más adelante en la arquitectura.
     */
    get eventName(): string {
        return this.constructor.name;
    }
}

//Ejemplo
/*
// UserCreatedEvent.ts
import { DomainEvent } from './DomainEvent';


 * Evento que indica que un nuevo usuario ha sido registrado en el sistema.
 
export class UserCreatedEvent extends DomainEvent {
  // Las propiedades son "readonly" para garantizar la inmutabilidad
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super(); 
    // super() asignará automáticamente la fecha en 'occurredOn'
  }
}
*/