import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from '../../common/common.module';
import { MessageMapper } from '../../common/mappers/message.mapper';
import { createRequestMock } from '../../common/tests/mocks/request.mock';
import { createResponseMock } from '../../common/tests/mocks/response.mock';
import { config } from '../../config';
import { validationSchema } from '../../config/config.schema';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { ThrottlerConfig } from '../../config/throttler.config';
import { TokenTypeEnum } from '../../jwt/enums/token-type.enum';
import { JwtModule } from '../../jwt/jwt.module';
import { JwtService } from '../../jwt/jwt.service';
import { MailerModule } from '../../mailer/mailer.module';
import { MailerService } from '../../mailer/mailer.service';
import { OAuthProvidersEnum } from '../../users/enums/oauth-providers.enum';
import { IUser } from '../../users/interfaces/user.interface';
import { UsersModule } from '../../users/users.module';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthResponseUserMapper } from '../mappers/auth-response-user.mapper';

describe('AuthController', () => {
  let module: TestingModule,
    controller: AuthController,
    mailerService: MailerService,
    jwtService: JwtService,
    orm: MikroORM,
    cookieName: string;

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
        MailerModule,
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          useClass: ThrottlerConfig,
        }),
      ],
      providers: [AuthService, CommonModule],
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    orm = module.get<MikroORM>(MikroORM);
    await orm.getSchemaGenerator().createSchema();

    mailerService = module.get<MailerService>(MailerService);
    jest.spyOn(mailerService, 'sendEmail').mockImplementation();
    jest.spyOn(mailerService, 'sendResetPasswordEmail').mockImplementation();

    jwtService = module.get<JwtService>(JwtService);

    const configService = module.get<ConfigService>(ConfigService);
    cookieName = configService.get<string>('REFRESH_COOKIE');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(mailerService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(orm).toBeDefined();
    expect(cookieName).toBeDefined();
  });

  const name = faker.person.firstName();
  const email = faker.internet.email().toLowerCase();
  const password = faker.internet.password({ length: 10 });
  const mockUser = {
    id: 1,
    name,
    email,
    credentials: {
      version: 0,
    },
  } as IUser;
  describe('signUp', () => {
    it('should throw a BadRequestException if the passwords do not match', async () => {
      await expect(
        controller.signUp({
          name,
          email,
          password1: password,
          password2: faker.internet.password({ length: 10 }),
        }),
      ).rejects.toThrow('Passwords do not match');
    });

    it('should create a user and return a message', async () => {
      const message = await controller.signUp({
        name,
        email,
        password1: password,
        password2: password,
      });
      expect(message).toBeInstanceOf(MessageMapper);
      expect(message.message).toBe('Registration successful');
    });

    it('should throw a ConflictException if the email is already in use', async () => {
      await expect(
        controller.signUp({
          name,
          email,
          password1: password,
          password2: password,
        }),
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('confirm email', () => {
    const res = createResponseMock();

    it('should throw a BadRequestException if the token is invalid', async () => {
      await expect(
        controller.confirmEmail(
          {
            confirmationToken: 'invalid',
          },
          res,
        ),
      ).rejects.toThrow('Invalid token');
    });

    it('should create json a response if token is valid', async () => {
      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.CONFIRMATION,
      );
      await controller.confirmEmail({ confirmationToken: token }, res);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      mockUser.credentials.version = 1;
    });
  });

  describe('sign in', () => {
    const res = createResponseMock();

    it('should throw a invalid credentials if email is wrong', async () => {
      await expect(
        controller.signIn(res, {
          emailOrUsername: faker.internet.email(),
          password,
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw a invalid credentials if password is wrong', async () => {
      await expect(
        controller.signIn(res, {
          emailOrUsername: email,
          password: faker.internet.password({ length: 10 }),
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw a invalid credentials if username is wrong', async () => {
      await expect(
        controller.signIn(res, {
          emailOrUsername: 'wrong',
          password,
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should sign in user', async () => {
      await controller.signIn(res, {
        emailOrUsername: email,
        password,
      });
      expect(res.cookie).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw an UnauthorizedException if the user is not confirmed', async () => {
      const newEmail = faker.internet.email().toLowerCase();
      await controller.signUp({
        name: faker.person.firstName(),
        email: newEmail,
        password1: password,
        password2: password,
      });
      await expect(
        controller.signIn(res, {
          emailOrUsername: newEmail,
          password,
        }),
      ).rejects.toThrow(
        'Please confirm your email, a new email has been sent',
      );
    });
  });

  describe('refresh access', () => {
    const req = createRequestMock();
    const res = createResponseMock();

    it('should throw a UnauthorizedException if there is no token', async () => {
      await expect(controller.refreshAccess(req, res)).rejects.toThrow(
        'Unauthorized',
      );
    });

    it('should throw a UnauthorizedException if the token is invalid', async () => {
      req.setCookie(cookieName, 'invalid');
      await expect(controller.refreshAccess(req, res)).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should refresh token', async () => {
      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.REFRESH,
      );
      req.setCookie(cookieName, token);
      await controller.refreshAccess(req, res);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('logout', () => {
    const req = createRequestMock();
    const res = createResponseMock();

    it('should throw a UnauthorizedException if there is no token', async () => {
      await expect(controller.logout(req, res)).rejects.toThrow(
        'Unauthorized',
      );
    });

    it('should throw a UnauthorizedException if the token is invalid', async () => {
      req.setCookie(cookieName, 'invalid');
      await expect(controller.logout(req, res)).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should logout user', async () => {
      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.REFRESH,
      );
      req.setCookie(cookieName, token);
      await controller.logout(req, res);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('forgot password', () => {
    it('should return a message even if user does not exists', async () => {
      const message = await controller.forgotPassword({
        email: faker.internet.email(),
      });
      expect(message).toBeInstanceOf(MessageMapper);
      expect(message.message).toBe('Reset password email sent');
      expect(mailerService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('should send an email if user exists', async () => {
      const message = await controller.forgotPassword({
        email,
      });
      expect(message).toBeInstanceOf(MessageMapper);
      expect(message.message).toBe('Reset password email sent');
      expect(mailerService.sendResetPasswordEmail).toHaveBeenCalled();
    });
  });

  describe('reset password', () => {
    it('should throw a BadRequestException if the token is invalid', async () => {
      const password = faker.internet.password({ length: 10 });
      await expect(
        controller.resetPassword({
          resetToken: 'invalid',
          password1: password,
          password2: password,
        }),
      ).rejects.toThrow('Invalid token');
    });

    it('should throw a BadRequestException if the passwords do not match', async () => {
      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.RESET_PASSWORD,
      );
      const password = faker.internet.password({ length: 10 });
      await expect(
        controller.resetPassword({
          resetToken: token,
          password1: password,
          password2: faker.internet.password({ length: 10 }),
        }),
      ).rejects.toThrow('Passwords do not match');
    });
  });

  describe('reset password', () => {
    it('should throw a BadRequestException if the passwords do not match', async () => {
      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.RESET_PASSWORD,
      );

      await expect(
        controller.resetPassword({
          resetToken: token,
          password1: faker.internet.password({ length: 10 }),
          password2: faker.internet.password({ length: 10 }),
        }),
      ).rejects.toThrow('Passwords do not match');
    });

    it('should throw a BadRequestException if the token is invalid', async () => {
      await expect(
        controller.resetPassword({
          resetToken: 'invalid',
          password1: password,
          password2: password,
        }),
      ).rejects.toThrow('Invalid token');
    });

    it('should reset the password', async () => {
      const token = await jwtService.generateToken(
        mockUser,
        TokenTypeEnum.RESET_PASSWORD,
      );
      const message = await controller.resetPassword({
        resetToken: token,
        password1: password,
        password2: password,
      });
      expect(message).toBeInstanceOf(MessageMapper);
      expect(message.message).toBe('Password reset successfully');
    });
  });

  describe('update password', () => {
    const res = createResponseMock();

    it('should throw a BadRequestException if the passwords do not match', async () => {
      await expect(
        controller.updatePassword(
          mockUser.id,
          {
            password,
            password1: faker.internet.password({ length: 10 }),
            password2: faker.internet.password({ length: 10 }),
          },
          res,
        ),
      ).rejects.toThrow('Passwords do not match');
    });

    it('should throw a BadRequestException if the old password is wrong', async () => {
      await expect(
        controller.updatePassword(
          mockUser.id,
          {
            password: faker.internet.password({ length: 10 }),
            password1: password,
            password2: password,
          },
          res,
        ),
      ).rejects.toThrow('Wrong password');
    });

    it('should throw a password if password is the same', async () => {
      await expect(
        controller.updatePassword(
          mockUser.id,
          {
            password,
            password1: password,
            password2: password,
          },
          res,
        ),
      ).rejects.toThrow('New password must be different');
    });

    it('should change the password', async () => {
      const mewPassword = faker.internet.password({ length: 10 });
      await controller.updatePassword(
        mockUser.id,
        {
          password,
          password1: mewPassword,
          password2: mewPassword,
        },
        res,
      );
      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('should get a user', async () => {
      const user = await controller.getMe(mockUser.id);
      expect(user).toBeInstanceOf(AuthResponseUserMapper);
    });
  });

  describe('providers', () => {
    it('should get providers', async () => {
      const providers = await controller.getOAuthProviders(mockUser.id);
      expect(providers.data).toHaveLength(1);
      expect(providers.data[0].provider).toBe(OAuthProvidersEnum.LOCAL);
    });
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.close(true);
    await module.close();
  });
});
