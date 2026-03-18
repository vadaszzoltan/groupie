import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: { origin: true, credentials: true } });
  app.setGlobalPrefix('');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));


  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

bootstrap();
