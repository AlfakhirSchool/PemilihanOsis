import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  mkdirSync(join(process.cwd(), 'uploads', 'candidates'), { recursive: true });
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Backend duduk di belakang cloudflared (localhost, bukan proxy publik yang dikenal Express) —
  // tanpa ini req.ip selalu 127.0.0.1 buat SEMUA orang, jadi rate limit ke-share satu bucket
  // bukan per-pengunjung. Cloudflare Tunnel meneruskan X-Forwarded-For asli dari edge.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
