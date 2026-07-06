import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // A wildcard origin ("*") combined with credentials:true is rejected by
  // browsers outright (and is a bad idea even if it weren't). If
  // CORS_ORIGIN isn't set we fail closed to no cross-origin access rather
  // than silently falling back to an open policy.
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
  if (!corsOrigins || corsOrigins.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      'CORS_ORIGIN is not set — cross-origin requests will be rejected. ' +
        'Set CORS_ORIGIN to a comma-separated allowlist (e.g. http://localhost:5173) for the frontend to reach this API.',
    );
  }
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
  });

  // Strip unknown fields and enforce DTO validation on every route
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Hades Fund Management Platform API')
    .setDescription(
      'Investors, subscriptions, distributions, redemptions, compliance and reporting API',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Hades API running on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
