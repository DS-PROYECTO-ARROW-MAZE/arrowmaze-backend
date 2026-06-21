import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    example: 'jac@test.com',
    description: 'El correo electrónico del jugador',
  })
  public readonly email!: string;

  @ApiProperty({
    example: 'secreta123',
    description: 'La contraseña segura del jugador',
    minLength: 6,
  })
  public readonly password!: string;
}
