import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import fastifyHelmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { FastifyInstance } from 'fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);
  const fastifyInstance = app.getHttpAdapter().getInstance() as FastifyInstance;
  await fastifyInstance.register(fastifyCookie, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });
  await fastifyInstance.register(fastifyHelmet);
  
  await fastifyInstance.register(fastifyCsrfProtection, {
    cookieOpts: { signed: true }
  });

  await fastifyInstance.register(fastifyCors, {
    credentials: true,
    origin: `https://${configService.get<string>('domain')}`,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Solveit2 API')
    .setDescription('Esta API fornece suporte ao aplicativo SolveIt, uma plataforma colaborativa onde usuários podem compartilhar problemas reais e buscar soluções inovadoras em conjunto. O backend foi desenvolvido com NestJS, utilizando TypeScript, Fastify, JWT para autenticação, e integrações com Postgresql e Oauth2.0. A documentação a seguir descreve os endpoints disponíveis e seus respectivos usos.')
    .setVersion('0.0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header'
      },
      'access-token',
    )
    .addTag('Solveit API')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(
    configService.get<number>('port'),
    configService.get<boolean>('testing') ? '127.0.0.1' : '0.0.0.0',
  );
}

bootstrap();