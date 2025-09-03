import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('🚚 OptiRoute API')
    .setDescription('Documentación de OptiRoute API')
    .setVersion('1.0')
    .addTag('Users') // Opcional, para agrupar endpoints
    .addTag('Vehicles')
    .addTag('Gps')
    .addTag('Driver')
    .addTag('Requests')
    .addTag('Auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Accedé en http://localhost:3000/api

  await app.listen(port);

  // URL clickeable de Swagger
  console.log(`\n📚 Swagger Documentation: http://localhost:${port}/api`);
}
bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
});