// Entity.ts
/**
 * Clase base para las Entidades.
 * Se identifican por un ID único en lugar de por sus propiedades.
 */
export abstract class Entity<T> {
    protected readonly _id: string;
    public readonly props: T;

    constructor(props: T, id?: string) {
        // Si no se proporciona un ID, generamos uno automáticamente.
        // Requiere Node 19+ o un polyfill para crypto en entornos más antiguos.
        this._id = id ? id : crypto.randomUUID();
        this.props = props;
    }

    get id(): string {
        return this._id;
    }

    /**
     * Dos entidades son iguales si, y solo si, tienen el mismo ID.
     */
    public equals(object?: Entity<T>): boolean {
        if (object == null || object == undefined) {
            return false;
        }
        if (this === object) {
            return true;
        }
        return this._id === object._id;
    }
}



