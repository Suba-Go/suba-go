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

import { Serialize } from './common/interceptors/serialize.interceptor';
import { SuperJsonInterceptor } from './common/interceptors/superjson.interceptor';
import { getNodeEnv } from './utils/env';
import { WsAuthAdapter } from './modules/providers-modules/realtime/ws-auth.adapter';
dotenv.config({
  path: '.env',
});
const PORT = parseInt(process.env.PORT) || 3333;

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure WebSocket adapter with authentication
  const wsAdapter = new WsAuthAdapter(app);
  app.useWebSocketAdapter(wsAdapter);

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

  let origins: (string | RegExp)[];

  // Determine environment based on NODE_ENV
  const nodeEnv = getNodeEnv();

  if (nodeEnv === 'local') {
    // Local development: Allow localhost and any subdomain.localhost
    origins = ['http://localhost:3000', /^http:\/\/[\w-]+\.localhost:3000$/];
  } else if (nodeEnv === 'development') {
    // Development environment: Allow development.subago.cl and subdomains
    origins = [
      'https://development.subago.cl',
      'https://www.development.subago.cl',
      /^https:\/\/[\w-]+\.development\.subago\.cl$/,
    ];
  } else {
    // Production: Allow main domain, www, tenant subdomains, and Vercel URLs
    const rootDomain = process.env.ROOT_DOMAIN || 'subago.cl';
    origins = [
      `https://${rootDomain}`,
      `https://www.${rootDomain}`,
      new RegExp(`^https://[\\w-]+\\.${rootDomain.replace('.', '\\.')}$`),
      // Vercel preview URLs (for both preview and production deployments)
      /^https:\/\/[\w-]+---[\w-]+\.vercel\.app$/,
      /^https:\/\/[\w-]+\.vercel\.app$/,
    ];
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
  await app.listen(
    process.env.PORT ? Number(process.env.PORT) : 3000,
    '0.0.0.0'
  );

  // Determine the server URL based on environment
  const serverUrl =
    nodeEnv === 'local'
      ? `http://localhost:${PORT}`
      : process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : process.env.RENDER_EXTERNAL_URL
      ? process.env.RENDER_EXTERNAL_URL
      : `http://0.0.0.0:${PORT}`;

  logger.log(`Server running on ${serverUrl}`);

  // CRITICAL: Bind WebSocket authentication AFTER the HTTP server has started
  // This ensures the HTTP server is available for the upgrade handler
  wsAdapter.bindAuthenticationAfterInit();
}
bootstrap();
