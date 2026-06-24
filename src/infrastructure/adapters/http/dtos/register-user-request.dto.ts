import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserRequestDto {
  @ApiProperty({
    example: 'jac@test.com',
    description: 'El correo electrónico del jugador',
  })
  @IsEmail()
  public readonly email!: string;

  @ApiProperty({
    example: 'secreta123',
    description: 'La contraseña segura del jugador',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  public readonly password!: string;
}
