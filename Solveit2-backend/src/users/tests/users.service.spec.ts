import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { compare } from 'bcrypt';
import { CommonModule } from '../../common/common.module';
import { CommonService } from '../../common/common.service';
import { config } from '../../config';
import { validationSchema } from '../../config/config.schema';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { OAuthProviderEntity } from '../entities/oauth-provider.entity';
import { UserEntity } from '../entities/user.entity';
import { OAuthProvidersEnum } from '../enums/oauth-providers.enum';
import { UsersService } from '../users.service';
import { JwtService } from '../../jwt/jwt.service';
import { MailerModule } from '../../mailer/mailer.module';

describe('UsersService', () => {
  let module: TestingModule,
    service: UsersService,
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
        MikroOrmModule.forFeature([UserEntity, OAuthProviderEntity]),
        CommonModule,
        MailerModule,
      ],
      providers: [UsersService, CommonModule, JwtService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    commonService = module.get<CommonService>(CommonService);
    orm = module.get<MikroORM>(MikroORM);
    await orm.getSchemaGenerator().createSchema();
  });

  const email = faker.internet.email();
  const email2 = faker.internet.email();
  const name = faker.person.firstName();
  const password = faker.internet.password({ length: 8 });
  const email3 = faker.internet.email();
  const name2 = faker.person.fullName();

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
    expect(commonService).toBeDefined();
    expect(orm).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const user = await service.create(
        OAuthProvidersEnum.LOCAL,
        email,
        name,
        password,
      );
      expect(user).toBeInstanceOf(UserEntity);
      expect(user.username).toEqual(commonService.generatePointSlug(name));
      expect(user.confirmed).toBeFalsy();

      const providers = await service.findOAuthProviders(user.id);
      expect(providers).toHaveLength(1);
      expect(providers[0].provider).toEqual(OAuthProvidersEnum.LOCAL);
    });

    it('should throw a conflict exception', async () => {
      await expect(
        service.create(
          OAuthProvidersEnum.LOCAL,
          email,
          faker.person.firstName(),
          faker.internet.password({ length: 8 }),
        ),
      ).rejects.toThrow('Email already in use');
    });

    it('should create a user with a different username', async () => {
      const user = await service.create(
        OAuthProvidersEnum.LOCAL,
        email2,
        name,
        faker.internet.password({ length: 8 }),
      );
      expect(user).toBeInstanceOf(UserEntity);
      expect(user.username).toEqual(
        commonService.generatePointSlug(name) + '1',
      );
    });

    it('should create a user without password if provider is not local', async () => {
      const user = await service.create(
        OAuthProvidersEnum.GOOGLE,
        email3,
        name2,
      );
      expect(user).toBeInstanceOf(UserEntity);
      expect(user.username).toEqual(commonService.generatePointSlug(name2));
      expect(user.confirmed).toBeTruthy();

      const providers = await service.findOAuthProviders(user.id);
      expect(providers).toHaveLength(1);
      expect(providers[0].provider).toEqual(OAuthProvidersEnum.GOOGLE);
    });
  });

  describe('read', () => {
    describe('by id', () => {
      it('should find a user by id', async () => {
        const user = await service.findOneById(1);
        expect(user).toBeInstanceOf(UserEntity);
      });

      it('should throw a not found exception', async () => {
        await expect(service.findOneById(4)).rejects.toThrow(
          'User not found',
        );
      });
    });

    describe('by username', () => {
      it('should find a user by username', async () => {
        const user = await service.findOneByUsername(
          commonService.generatePointSlug(name),
        );
        expect(user).toBeInstanceOf(UserEntity);
      });

      it('should throw a not found exception', async () => {
        await expect(
          service.findOneByUsername('not-found'),
        ).rejects.toThrow('User not found');
      });

      it('should throw an unauthorized exception', async () => {
        await expect(
          service.findOneByUsername('not-found', true),
        ).rejects.toThrow('Invalid credentials');
      });
    });

    describe('by email', () => {
      it('should find a user by email', async () => {
        const user = await service.findOneByEmail(email);
        expect(user).toBeInstanceOf(UserEntity);
      });

      it('should throw an unauthorized exception', async () => {
        await expect(service.findOneByEmail('not-found')).rejects.toThrow(
          'Invalid credentials',
        );
      });

      it('should return null if not found', async () => {
        const user = await service.uncheckedUserByEmail('not-found');
        expect(user).toBeNull();
      });
    });

    describe('by credentials', () => {
      it('should find a user by credentials', async () => {
        const user = await service.findOneByCredentials(1, 0);
        expect(user).toBeInstanceOf(UserEntity);
      });

      it('should throw an unauthorized exception', async () => {
        await expect(service.findOneByCredentials(1, 1)).rejects.toThrow(
          'Invalid credentials',
        );
      });
    });
  });

  describe('update', () => {
    describe('username', () => {
      it('should update a user username', async () => {
        const user = await service.update(1, {
          username: 'new-username',
        });
        expect(user).toBeInstanceOf(UserEntity);
        expect(user.username).toEqual('new-username');
      });

      it('should throw a conflict exception', async () => {
        await expect(
          service.update(2, { username: 'new-username' }),
        ).rejects.toThrow('Username already in use');
      });
    });

    describe('email', () => {
      it('should throw a bad request exception if password is wrong', async () => {
        await expect(
          service.updateEmail(1, {
            email: faker.internet.email(),
            password: password + '1',
          }),
        ).rejects.toThrow('Wrong password');
      });

      it('should update a user email', async () => {
        const newEmail = faker.internet.email();
        const result = await service.updateEmail(1, {
          email: newEmail,
          password,
        });
        
        expect(result).toEqual({
          message: expect.stringContaining('A confirmation email has been sent to'),
        });
      });

      it('should throw a conflict exception', async () => {
        await expect(
          service.updateEmail(1, { email: email2, password }),
        ).rejects.toThrow('Email already in use');
      });
    });

    describe('password', () => {
      const newPassword = faker.internet.password({ length: 8 });

      it('should update a user password', async () => {
        const user = await service.updatePassword(1, newPassword, password);
        expect(user).toBeInstanceOf(UserEntity);
        expect(await compare(newPassword, user.password)).toBe(true);
        expect(user.credentials.version).toStrictEqual(1);
      });

      it('should throw a bad request exception if the new password is the same', async () => {
        await expect(
          service.updatePassword(1, newPassword, newPassword),
        ).rejects.toThrow('New password must be different');
      });

      it('should throw a bad request exception if the password is wrong', async () => {
        await expect(
          service.updatePassword(
            1,
            'wrong-password',
            faker.internet.password({ length: 8 }),
          ),
        ).rejects.toThrow('Wrong password');
      });

      it('should reset a user password', async () => {
        const user = await service.resetPassword(1, 1, password);
        expect(user).toBeInstanceOf(UserEntity);
        expect(await compare(password, user.password)).toBe(true);
        expect(user.credentials.version).toStrictEqual(2);
      });

      it('should throw an unauthorized exception', async () => {
        await expect(
          service.resetPassword(1, 0, faker.internet.password({ length: 8})),
        ).rejects.toThrow('Invalid credentials');
      });

      it('should add a local provider if you have an external provider', async () => {
        const user = await service.updatePassword(3, password);
        expect(user).toBeInstanceOf(UserEntity);
        expect(await compare(password, user.password)).toBe(true);
        expect(user.credentials.version).toStrictEqual(2);

        const providers = await service.findOAuthProviders(3);
        expect(providers).toHaveLength(2);
        expect(providers[1].provider).toEqual(OAuthProvidersEnum.LOCAL);
      });
    });
  });

  describe('delete', () => {
    it('should throw an error if password is wrong', async () => {
      await expect(
        service.delete(1, { password: password + '1' }),
      ).rejects.toThrow('Wrong password');
    });

    it('should delete a user', async () => {
      await service.delete(1, { password });
      await expect(service.findOneById(1)).rejects.toThrow(
        'User not found',
      );
    });
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.close(true);
    await module.close();
  });
});
