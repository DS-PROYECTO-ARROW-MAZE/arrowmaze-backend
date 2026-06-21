import { Controller, Post, Body, UseFilters } from '@nestjs/common';
import { RegisterUserUseCase } from '../../../../application/use-cases/register-user.use-case';
import { RegisterUserRequestDto } from '../dtos/register-user-request.dto';
import { EmailYaRegistradoExceptionFilter } from '../filters/email-ya-registrado-exception.filter';

@Controller('auth')
@UseFilters(EmailYaRegistradoExceptionFilter)
export class AuthController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post('register')
  async register(@Body() dto: RegisterUserRequestDto) {
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
