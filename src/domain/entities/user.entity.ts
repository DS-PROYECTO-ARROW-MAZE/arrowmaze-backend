export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public passwordHash: string,
    public readonly createdAt: Date,
  ) {}
}
