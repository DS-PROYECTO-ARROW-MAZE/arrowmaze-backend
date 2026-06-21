import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InterceptorCacheRanking } from './interceptor-cache-ranking';

describe('InterceptorCacheRanking', () => {
  let interceptor: InterceptorCacheRanking;
  let mockHandler: CallHandler;
  let mockExecutionContext: ExecutionContext;

  const createMockContext = (query: Record<string, any>) => {
    const request = { query };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
      getClass: () => ({}),
      getHandler: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => null,
      getType: () => 'http' as const,
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    interceptor = new InterceptorCacheRanking();
    mockHandler = {
      handle: jest.fn().mockReturnValue(of({ entradas: [] })),
    };
  });

  it('should_invoke_the_handler_once_when_two_identical_requests_arrive_within_ttl', (done: jest.DoneCallback) => {
    const query = { idNivel: 'nivel-1', limite: '10' };
    mockExecutionContext = createMockContext(query);

    interceptor
      .intercept(mockExecutionContext, mockHandler)
      .pipe(
        tap(() => {
          interceptor
            .intercept(mockExecutionContext, mockHandler)
            .pipe(
              tap(() => {
                expect(mockHandler.handle).toHaveBeenCalledTimes(1);
                done();
              }),
            )
            .subscribe();
        }),
      )
      .subscribe();
  });

  it('should_invoke_the_handler_again_when_a_request_comes_with_a_different_key', (done: jest.DoneCallback) => {
    const query1 = { idNivel: 'nivel-1', limite: '10' };
    const query2 = { idNivel: 'nivel-2', limite: '10' };

    mockExecutionContext = createMockContext(query1);

    interceptor
      .intercept(mockExecutionContext, mockHandler)
      .pipe(
        tap(() => {
          const context2 = createMockContext(query2);

          interceptor
            .intercept(context2, mockHandler)
            .pipe(
              tap(() => {
                expect(mockHandler.handle).toHaveBeenCalledTimes(2);
                done();
              }),
            )
            .subscribe();
        }),
      )
      .subscribe();
  });

  it('should_invoke_the_handler_again_after_ttl_expires', (done: jest.DoneCallback) => {
    interceptor = new InterceptorCacheRanking();
    interceptor.ttlMs = 100;
    const query = { idNivel: 'nivel-1', limite: '5' };
    mockExecutionContext = createMockContext(query);

    interceptor
      .intercept(mockExecutionContext, mockHandler)
      .pipe(
        tap(() => {
          setTimeout(() => {
            interceptor
              .intercept(mockExecutionContext, mockHandler)
              .pipe(
                tap(() => {
                  expect(mockHandler.handle).toHaveBeenCalledTimes(2);
                  done();
                }),
              )
              .subscribe();
          }, 150);
        }),
      )
      .subscribe();
  });

  it('should_serve_cached_response_for_repeated_request_within_ttl', (done: jest.DoneCallback) => {
    const query = { idNivel: 'nivel-1', limite: '3' };
    mockExecutionContext = createMockContext(query);
    mockHandler = {
      handle: jest.fn().mockReturnValue(of({ entradas: [{ puntaje: 900 }] })),
    };

    interceptor
      .intercept(mockExecutionContext, mockHandler)
      .pipe(
        tap((firstResult: any) => {
          interceptor
            .intercept(mockExecutionContext, mockHandler)
            .pipe(
              tap((secondResult: any) => {
                expect(secondResult).toEqual(firstResult);
                done();
              }),
            )
            .subscribe();
        }),
      )
      .subscribe();
  });
});
