import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { NivelNoEncontradoException } from '../../../../domain/exceptions/nivel-no-encontrado.exception';

@Catch(NivelNoEncontradoException)
export class NivelNoEncontradoFilter implements ExceptionFilter {
  catch(exception: NivelNoEncontradoException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      message: exception.message,
      error: 'Not Found',
    });
  }
}
