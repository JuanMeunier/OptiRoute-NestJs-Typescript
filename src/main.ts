import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('OptiRoute API')
    .setDescription('Documentación de OptiRoute API')
    .setVersion('1.0')
    .addTag('Users') // Opcional, para agrupar endpoints
    .addTag('Vehicles')
    .addTag('Gps')
    .addTag('Driver')
    .addTag('Request')
    .addTag('Auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Accedé en http://localhost:3000/api
}
bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
});