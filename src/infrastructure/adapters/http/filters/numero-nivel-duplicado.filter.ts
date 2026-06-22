import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { NumeroNivelDuplicadoException } from '../../../../domain/exceptions/numero-nivel-duplicado.exception';

@Catch(NumeroNivelDuplicadoException)
export class NumeroNivelDuplicadoFilter implements ExceptionFilter {
  catch(exception: NumeroNivelDuplicadoException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      message: exception.message,
      error: 'Conflict',
    });
  }
}
