import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { createDocument } from './swagger/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  SwaggerModule.setup('api/v1', app, createDocument(app));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
