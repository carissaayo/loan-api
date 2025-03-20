import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { createDocument } from './swagger/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });
  SwaggerModule.setup('api/v1', app, createDocument(app));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000); // Default to 3000 if not set

  await app.listen(port);
  console.log(` Server running on port ${port}`);
  // await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
