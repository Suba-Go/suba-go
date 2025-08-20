import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import superjson from 'superjson';

@Injectable()
export class SuperJsonInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // Deserialize incoming superjson data
    if (request.body && request.body.superjson) {
      try {
        request.body = superjson.deserialize(request.body.superjson);
      } catch (error) {
        console.error('Failed to deserialize superjson data:', error);
        // If deserialization fails, keep the original body
      }
    }

    return next.handle().pipe(
      map((data) => {
        if (data === undefined || data === null) {
          return data;
        }
        return {
          superjson: superjson.serialize(data),
        };
      })
    );
  }
}
