import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';

interface CacheEntry {
  response: any;
  timestamp: number;
}

@Injectable()
export class InterceptorCacheRanking implements NestInterceptor {
  public ttlMs: number = 60_000;

  private cache = new Map<string, CacheEntry>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { idNivel, limite } = request.query ?? {};
    const key = `${idNivel}:${limite}`;

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttlMs) {
      return of(cached.response);
    }

    return new Observable((subscriber) => {
      next.handle().subscribe({
        next: (value) => {
          this.cache.set(key, { response: value, timestamp: Date.now() });
          subscriber.next(value);
          subscriber.complete();
        },
        error: (err) => subscriber.error(err),
      });
    });
  }
}
