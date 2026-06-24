import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
import { EmailYaRegistradoException } from '../../../../domain/exceptions/email-ya-registrado.exception';

@Catch(EmailYaRegistradoException)
export class EmailYaRegistradoExceptionFilter implements ExceptionFilter {
  catch(exception: EmailYaRegistradoException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const conflict = new ConflictException(exception.message);

    response.status(conflict.getStatus()).json(conflict.getResponse());
  }
}
