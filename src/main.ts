// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de Swagger (OpenAPI)
  const config = new DocumentBuilder()
    .setTitle('ArrowMaze API')
    .setDescription('API REST para el clon de Escape Puzzle')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Exponemos la interfaz visual en la ruta /api/docs
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
