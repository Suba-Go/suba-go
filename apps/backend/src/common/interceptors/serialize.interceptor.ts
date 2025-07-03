import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToClass, ClassConstructor } from 'class-transformer';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto?: ClassConstructor<object>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<object> {
    return next.handle().pipe(
      map((data: object) => {
        if (!this.dto || !data) return data;
        return plainToClass(this.dto, data, {
          excludeExtraneousValues: true,
        });
      })
    );
  }
}

@Injectable()
export class Serialize implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<object> {
    return next.handle();
  }
}

export function SerializeDecorator(dto?: ClassConstructor<object>) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const result = originalMethod.apply(this, args);
      if (result instanceof Observable) {
        return result.pipe(
          map((data) => {
            if (!dto) return data;
            return plainToClass(dto, data, {
              excludeExtraneousValues: true,
            });
          })
        );
      }
      return result;
    };
    return descriptor;
  };
}
