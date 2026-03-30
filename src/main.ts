import { NestApplication, NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const _logger = new Logger(NestApplication.name);

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Token Disbursement Service')
      .setDescription('API service for Token Disbursement')
      .setVersion('1.0')
      // .addBearerAuth(
      //   { type: 'http', scheme: 'bearer', bearerFormat: APP.JWT_BEARER },
      //   APP.JWT_BEARER
      // )
      .build();

    app.enableCors({
      origin: 'http://localhost:3000', // your Vite dev server
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

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
