export class Posicion {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  equals(other: Posicion): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
