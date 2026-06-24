import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ReglaTiempoNivelException } from '../../../../domain/exceptions/regla-tiempo-nivel.exception';

@Catch(ReglaTiempoNivelException)
export class ReglaTiempoNivelFilter implements ExceptionFilter {
  catch(exception: ReglaTiempoNivelException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: exception.message,
      error: 'Unprocessable Entity',
    });
  }
}
