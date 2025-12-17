import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import { Request, Response, NextFunction } from 'express';

declare module 'express' {
  interface Request {
    rawBody?: Buffer;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Global JSON parser for all other routes
  app.use(bodyParser.json());

  // CORS setup
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins =
        config.get<string>('CORS_ORIGINS')?.split(',').map(o => o.trim()) || [];

      console.log('🌍 Request Origin:', origin);
      console.log('✅ Allowed Origins:', allowedOrigins);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  // Global API prefix
  // app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  const port = config.get<number>('PORT') || 4000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
