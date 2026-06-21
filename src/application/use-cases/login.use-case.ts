import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { CredencialesInvalidasException } from '../../domain/exceptions/credenciales-invalidas.exception';
import type { IHashContrasena } from '../ports/hash-contrasena.port';
import type { IProveedorSesion } from '../ports/proveedor-sesion.port';
import { LoginDto, LoginResultadoDto } from '../dtos/login.dto';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashContrasena: IHashContrasena,
    private readonly proveedorSesion: IProveedorSesion,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResultadoDto> {
    const usuario = await this.userRepository.findByEmail(dto.email);
    if (!usuario) {
      throw new CredencialesInvalidasException();
    }

    const esValida = await this.hashContrasena.compare(
      dto.password,
      usuario.passwordHash,
    );
    if (!esValida) {
      throw new CredencialesInvalidasException();
    }

    const token = this.proveedorSesion.guardarToken({
      id: usuario.id,
      email: usuario.email,
    });

    return { token };
  }
}
