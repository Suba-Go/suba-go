import { All, Controller, Req, Res, Next } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TrpcRouter } from './trpc.router';
import * as trpcExpress from '@trpc/server/adapters/express';

@Controller('trpc')
export class TrpcController {
  constructor(private readonly trpcRouter: TrpcRouter) {}

  @All('*')
  async handler(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    const handler = trpcExpress.createExpressMiddleware({
      router: this.trpcRouter.appRouter,
      createContext: () => ({}),
    });

    return handler(req, res, next);
  }
}
