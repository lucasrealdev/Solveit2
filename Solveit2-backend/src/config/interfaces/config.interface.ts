import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { IEmailConfig } from './email-config.interface';
import { IJwt } from './jwt.interface';
import { IOAuth2 } from './oauth2.interface';

export interface IConfig {
  readonly id: string;
  readonly url: string;
  readonly port: number;
  readonly domain: string;
  readonly audience: string;
  readonly redis: string;
  readonly db: MikroOrmModuleOptions;
  readonly jwt: IJwt;
  readonly emailService: IEmailConfig;
  readonly throttler: ThrottlerModuleOptions;
  readonly testing: boolean;
  readonly oauth2: IOAuth2;
}
