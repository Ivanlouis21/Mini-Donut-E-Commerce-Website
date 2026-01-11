import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
  });
  
  // Increase JSON body size limit for profile picture uploads (base64 images)
  // This increases the limit from default 100kb to 10mb for JSON payloads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  
  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  
  // Enable CORS for React frontend and PayMongo webhooks
  app.enableCors({
    origin: ['http://localhost:3000', 'https://dashboard.paymongo.com'], // Allow PayMongo dashboard
    credentials: true,
  });
  
  // Enable validation (skip for webhook endpoints to preserve raw body)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    skipMissingProperties: false,
    // Skip validation for webhook endpoint to preserve raw body
    skipNullProperties: false,
    skipUndefinedProperties: false,
  }));

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('Mini E-Commerce API for Crazy Mini Donuts - Backend API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('cart', 'Order cart endpoints')
    .addTag('orders', 'Order management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  // Initialize admin user if none exists (runs automatically on startup)
  try {
    const authService = app.get(AuthService);
    await authService.initializeAdminUser();
  } catch (error) {
    console.warn('⚠️  Could not initialize admin user:', error.message);
    console.warn('   You may need to create an admin manually using: node create-admin.js');
  }
  
  await app.listen(3001);
  console.log('Backend server running on http://localhost:3001');
  console.log('Swagger documentation available at http://localhost:3001/api-docs');
}
bootstrap();
