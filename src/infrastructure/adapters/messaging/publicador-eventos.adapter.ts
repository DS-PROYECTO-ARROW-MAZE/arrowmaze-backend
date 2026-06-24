import { Injectable } from '@nestjs/common';
import { DomainEvent } from '../../../domain/stereotypes/domain-event';
import { IPublicadorEventos } from '../../../domain/events/publicador-eventos.interface';

@Injectable()
export class PublicadorEventosAdapter implements IPublicadorEventos {
  publicar(eventos: readonly DomainEvent[]): Promise<void> {
    for (const evento of eventos) {
      console.log(`[eventos] ${evento.constructor.name}`, evento);
    }
    return Promise.resolve();
  }
}
