import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ThrottlerModuleOptions,
  ThrottlerOptionsFactory,
} from '@nestjs/throttler';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class ThrottlerConfig implements ThrottlerOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createThrottlerOptions(): ThrottlerModuleOptions {
    const testing = this.configService.get<boolean>('testing');
    const throttlerConfig = this.configService.get('throttler');
    const redisConfig = this.configService.get<RedisOptions>('redis');

    if (testing) {
      return {
        throttlers: throttlerConfig,
        storage: undefined,
      };
    }

    return {
      throttlers: throttlerConfig,
      storage: new ThrottlerStorageRedisService(
        new Redis({
          ...redisConfig,
          keyPrefix: 'throttler',
        }),
      ),
    };
  }
}