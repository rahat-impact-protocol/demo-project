import { NestApplication, NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const _logger = new Logger(NestApplication.name);

  const configuredOrigins = (
    process.env.CORS_ORIGINS ??
    process.env.CORS_ORIGIN ??
    ''
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Always allow localhost origins during development
      const isLocalOrigin =
        /^https?:\/\/localhost(?::\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin);

      if (isLocalOrigin) {
        callback(null, true);
        return;
      }

      // If no origins are configured, allow all
      if (configuredOrigins.length === 0) {
        callback(null, true);
        return;
      }

      // Allow only origins that match the configured list (supports * wildcards)
      const isAllowed = configuredOrigins.some((allowed) => {
        if (allowed === '*') return true;
        if (!allowed.includes('*')) return origin === allowed;
        const pattern = allowed
          .split('*')
          .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('.*');
        return new RegExp(`^${pattern}$`).test(origin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('CVA Project')
      .setDescription('API service for CVA Project')
      .setVersion('1.0')
      // .addBearerAuth(
      //   { type: 'http', scheme: 'bearer', bearerFormat: APP.JWT_BEARER },
      //   APP.JWT_BEARER
      // )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }

  const port = process.env.PORT || 5001;

  // Allow raw bodies for CSV / binary uploads so REST clients sending a binary body
  // (Content-Type: text/csv or application/octet-stream) are available on `req.body`.

  await app.listen(port);
  _logger.log(`App running in ${port}`);
  _logger.log(`Swagger UI: http://localhost:${port}/swagger`);
}
bootstrap();
