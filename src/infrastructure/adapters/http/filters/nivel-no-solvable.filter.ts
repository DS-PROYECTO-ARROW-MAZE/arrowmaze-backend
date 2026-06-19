import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { NivelNoSolvableException } from '../../../../domain/exceptions/nivel-no-solvable.exception';

@Catch(NivelNoSolvableException)
export class NivelNoSolvableFilter implements ExceptionFilter {
  catch(exception: NivelNoSolvableException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: exception.message,
      error: 'Unprocessable Entity',
    });
  }
}
