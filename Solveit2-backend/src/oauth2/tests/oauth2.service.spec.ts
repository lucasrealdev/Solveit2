import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { CommonService } from '../../common/common.service';
import { config } from '../../config';
import { validationSchema } from '../../config/config.schema';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { JwtModule } from '../../jwt/jwt.module';
import { UserEntity } from '../../users/entities/user.entity';
import { OAuthProvidersEnum } from '../../users/enums/oauth-providers.enum';
import { UsersModule } from '../../users/users.module';
import { UsersService } from '../../users/users.service';
import { Oauth2Service } from '../oauth2.service';
import { isJWT } from 'class-validator';

describe('Oauth2Service', () => {
  let module: TestingModule,
    oauth2Service: Oauth2Service,
    usersService: UsersService,
    commonService: CommonService,
    orm: MikroORM;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema,
          load: [config],
        }),
        CacheModule.register({
          isGlobal: true,
          ttl: parseInt(process.env.JWT_REFRESH_TIME, 10),
        }),
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          useClass: MikroOrmConfig,
        }),
        CommonModule,
        UsersModule,
        JwtModule,
        HttpModule.register({
          timeout: 5000,
          maxRedirects: 5,
        }),
      ],
      providers: [Oauth2Service, CommonModule],
    }).compile();

    oauth2Service = module.get<Oauth2Service>(Oauth2Service);
    usersService = module.get<UsersService>(UsersService);
    commonService = module.get<CommonService>(CommonService);
    orm = module.get<MikroORM>(MikroORM);
    await orm.getSchemaGenerator().createSchema();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(oauth2Service).toBeDefined();
    expect(usersService).toBeDefined();
    expect(commonService).toBeDefined();
    expect(orm).toBeDefined();
  });

  describe('getAuthorizationUrl', () => {
    let configService: ConfigService;
    
    beforeAll(() => {
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should return the google authorization url if config exists', async () => {
      const googleConfig = configService.get('oauth2.google');
      
      if (googleConfig) {
        const url = await oauth2Service.getAuthorizationUrl(OAuthProvidersEnum.GOOGLE);
        expect(url).toBeDefined();
        expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      } else {
        console.log('Skipping Google OAuth test - configuration not found');
      }
    });

    it('should return the facebook authorization url if config exists', async () => {
      const facebookConfig = configService.get('oauth2.facebook');
      
      if (facebookConfig) {
        const url = await oauth2Service.getAuthorizationUrl(OAuthProvidersEnum.FACEBOOK);
        expect(url).toBeDefined();
        expect(url).toContain('https://facebook.com/v9.0/dialog/oauth');
      } else {
        console.log('Skipping Facebook OAuth test - configuration not found');
      }
    });
  });
  

  describe('callback', () => {
    it('should create a new user', async () => {
      const email = faker.internet.email();
      const name = faker.person.fullName();
      const result = await oauth2Service.callback(
        OAuthProvidersEnum.GOOGLE,
        email,
        name,
      );

      expect(result).toMatchObject({
        accessToken: expect.any(String),
        code: expect.any(String),
        expiresIn: expect.any(Number),
      });
      expect(isJWT(result.accessToken)).toBe(true);
      expect(result.code).toHaveLength(22);

      const user = await usersService.findOneByEmail(email);
      expect(user).toBeDefined();
      expect(user.confirmed).toBeTruthy();

      const providers = await usersService.findOAuthProviders(user.id);
      expect(providers).toBeDefined();
      expect(providers).toHaveLength(1);
      expect(providers[0].provider).toBe(OAuthProvidersEnum.GOOGLE);
    });

    it('should login an existing user', async () => {
      const email = faker.internet.email();
      const name = faker.person.fullName();
      await usersService.create(OAuthProvidersEnum.GOOGLE, email, name);
      const result = await oauth2Service.callback(
        OAuthProvidersEnum.GOOGLE,
        email,
        name,
      );
  
      expect(result).toMatchObject({
        accessToken: expect.any(String),
        code: expect.any(String),
        expiresIn: expect.any(Number),
      });
      expect(isJWT(result.accessToken)).toBe(true);
      expect(result.code).toHaveLength(22);
  
      const user = await usersService.findOneByEmail(email);
      expect(user).toBeDefined();
      expect(user.confirmed).toBeTruthy();
  
      const providers = await usersService.findOAuthProviders(user.id);
      expect(providers).toBeDefined();
      expect(providers).toHaveLength(1);
      expect(providers[0].provider).toBe(OAuthProvidersEnum.GOOGLE);
    });
  });

  describe('token', () => {
    it('should return access and refresh tokens from callback code', async () => {
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const { code } = await oauth2Service.callback(
        OAuthProvidersEnum.GOOGLE,
        email,
        name,
      );
      const user = await usersService.findOneByEmail(email);

      const result = await oauth2Service.token(code, user.id);

      expect(result).toMatchObject({
        user: expect.any(UserEntity),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should throw an unauthorized exception for invalid callback code', async () => {
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      await oauth2Service.callback(OAuthProvidersEnum.GOOGLE, email, name);
      const user = await usersService.findOneByEmail(email);

      await expect(
        oauth2Service.token('7IHq0AGB7FOL25kt8WejRz', user.id),
      ).rejects.toThrow(new UnauthorizedException());
    });
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.close(true);
    await module.close();
  });
});
