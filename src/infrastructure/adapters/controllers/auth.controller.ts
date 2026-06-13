import { Controller, Post, Body } from '@nestjs/common';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { RegisterUserDto } from '../../../application/dtos/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) { }

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const newUser = await this.registerUserUseCase.execute(dto);

    return {
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    };
  }
}
