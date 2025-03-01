import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { config } from './config';
import { validationSchema } from './config/config.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [config],
    }),
    CommonModule,
  ],
  providers: [
    AppService
  ],
})
export class AppModule { }
