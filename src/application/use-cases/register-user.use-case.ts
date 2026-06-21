import { User } from '../../domain/entities/user.entity';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { EmailYaRegistradoException } from '../../domain/exceptions/email-ya-registrado.exception';
import type { IHashContrasena } from '../ports/hash-contrasena.port';
import type { IPublicadorEventos } from '../../domain/events/publicador-eventos.interface';
import { RegisterUserDto } from '../dtos/register-user.dto';
import type { IGeneradorId } from '../ports/generador-id.port';

export class RegisterUserUseCase {
  // Aplicando DIP: Dependemos de la abstracción (Interfaz), no de la implementación concreta
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashContrasena: IHashContrasena,
    private readonly publicadorEventos: IPublicadorEventos,
    private readonly generadorId: IGeneradorId,
  ) {}

  async execute(dto: RegisterUserDto): Promise<User> {
    // 1. Verificar si el usuario ya existe usando el puerto
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new EmailYaRegistradoException(dto.email);
    }

    // 2. Crear el agregado, con la contraseña ya hasheada — registrar() deja constancia
    // del evento de dominio "jugador registrado" (la reconstrucción vía el constructor
    // plano, usada por los mappers, nunca lo emite).
    const passwordHash = await this.hashContrasena.hash(dto.password);
    const newUser = User.registrar(
      this.generadorId.generar(),
      dto.email,
      passwordHash,
      new Date(),
    );

    // 3. Persistir la entidad usando el puerto
    await this.userRepository.save(newUser);

    // 4. Publicar solo tras el commit — un registro fallido no emite evento.
    await this.publicadorEventos.publicar(newUser.domainEvents);
    newUser.clearEvents();

    return newUser;
  }
}
