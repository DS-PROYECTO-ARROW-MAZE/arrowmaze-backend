export const I_HASH_CONTRASENA = 'IHashContrasena';

export interface IHashContrasena {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
