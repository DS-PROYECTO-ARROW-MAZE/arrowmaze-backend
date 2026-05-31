// ValueObject.ts
/**
 * Clase base para los Objetos de Valor.
 * Garantiza la inmutabilidad superficial y proporciona un método de igualdad por valor.
 */
export abstract class ValueObject<T extends Record<string, unknown>> {
    public readonly props: T;

    constructor(props: T) {
        // Congelamos el objeto para garantizar inmutabilidad superficial
        this.props = Object.freeze({ ...props });
    }

    /**
     * Compara dos Objetos de Valor evaluando si sus propiedades son exactamente iguales.
     */
    public equals(vo?: ValueObject<T>): boolean {
        if (vo === null || vo === undefined) {
            return false;
        }
        if (vo.props === undefined) {
            return false;
        }
        // Una comparación simple convirtiendo a JSON (Para estructuras muy complejas, 
        // podrías necesitar una función de "deep equals" más robusta)
        return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }
}

//Ejemplo 
/*
interface AddressProps {
  street: string;
  city: string;
  zipCode: string;
}

export class Address extends ValueObject<AddressProps> {
  // Puedes usar constructores privados y métodos estáticos de fábrica (Factory Methods) 
  // para encapsular las validaciones.
  public static create(props: AddressProps): Address {
    if (!props.zipCode) {
      throw new Error("El código postal es obligatorio.");
    }
    return new Address(props);
  }
}
  */