import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FlechaLongitudInvalidaException } from '../../../../domain/exceptions/flecha-longitud-invalida.exception';

@Catch(FlechaLongitudInvalidaException)
export class FlechaLongitudInvalidaFilter implements ExceptionFilter {
  catch(exception: FlechaLongitudInvalidaException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: exception.message,
      error: 'Unprocessable Entity',
    });
  }
}
