import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { CredencialesInvalidasException } from '../../../../domain/exceptions/credenciales-invalidas.exception';

@Catch(CredencialesInvalidasException)
export class CredencialesInvalidasExceptionFilter implements ExceptionFilter {
  catch(exception: CredencialesInvalidasException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const unauthorized = new UnauthorizedException(exception.message);

    response.status(unauthorized.getStatus()).json(unauthorized.getResponse());
  }
}
