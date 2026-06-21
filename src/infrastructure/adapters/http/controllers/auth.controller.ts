import {
  Controller,
  Post,
  Get,
  Body,
  Inject,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../../../application/use-cases/register-user.use-case';
import { LoginUseCase } from '../../../../application/use-cases/login.use-case';
import {
  I_PROVEEDOR_SESION,
  IProveedorSesion,
} from '../../../../application/ports/proveedor-sesion.port';
import { RegisterUserRequestDto } from '../dtos/register-user-request.dto';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { EmailYaRegistradoExceptionFilter } from '../filters/email-ya-registrado-exception.filter';
import { CredencialesInvalidasExceptionFilter } from '../filters/credenciales-invalidas-exception.filter';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
@UseFilters(
  EmailYaRegistradoExceptionFilter,
  CredencialesInvalidasExceptionFilter,
)
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    @Inject(I_PROVEEDOR_SESION)
    private readonly proveedorSesion: IProveedorSesion,
  ) {}

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

  @Post('login')
  async login(@Body() dto: LoginRequestDto) {
    return this.loginUseCase.execute(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me() {
    return { principal: this.proveedorSesion.obtenerPrincipal() };
  }
}
