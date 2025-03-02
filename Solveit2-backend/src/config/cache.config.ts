import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { CacheableMemory } from 'cacheable';
import Keyv from 'keyv';
import { createKeyv } from '@keyv/redis';

export const CacheConfig = (configService: ConfigService): CacheModuleOptions => {
  const isTesting = configService.get<boolean>('testing');
  const ttl = configService.get<number>('jwt.refresh.time') * 1000;

  return {
    stores: isTesting
      ? [new Keyv({ store: new CacheableMemory({ ttl, lruSize: 5000 }) })]
      : [createKeyv(configService.get('redis'))],
  };
};
