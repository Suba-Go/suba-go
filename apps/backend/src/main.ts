import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { Serialize } from './common/interceptors/serialize.interceptor';
import { SuperJsonInterceptor } from './common/interceptors/superjson.interceptor';
dotenv.config({
  path: process.env.NODE_ENV !== 'test' ? '.env' : '.env',
});
const PORT = parseInt(process.env.PORT) || 3333;

async function bootstrap() {
  const logger = new Logger();
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  //limit 2mb
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

  //enable proxy
  app.set('trust proxy', 1);

  //app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new Serialize());
  // app.setGlobalPrefix('Api Suba&Go');
  app.useGlobalInterceptors(new SuperJsonInterceptor());

  let origins: string[];

  if (process.env.NODE_ENV === 'development') {
    origins = ['http://localhost:3000'];
  } else {
    // pordefinir
  }

  app.enableCors({
    origin: origins,
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(
    rateLimit({
      windowMs: 30 * 1000,
      limit: 400,
      message: 'Muchas peticiones, por favor intenta más tarde.',
      handler: (req, res) => {
        logger.warn(
          `Too many requests to the API from IP: ${req.ip}, URL: ${req.originalUrl}`
        );
        res.status(415).send('Muchas peticiones, por favor intenta más tarde.');
      },
    })
  );

  // const config = new DocumentBuilder()
  //   .addBearerAuth()
  //   .setTitle('API Suba&Go')
  //   .setDescription('Suba&Go backend API')
  //   .setVersion('1.0')
  //   .addTag('api')
  //   .build();

  app.use(cookieParser());

  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api-docs', app, document);
  await app.listen(PORT);
  logger.log(`Server running on http://localhost:${PORT}`);
}
bootstrap();
