import { faker } from '@faker-js/faker';
import fastifyCookie from '@fastify/cookie';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CommonService } from '../src/common/common.service';
import { TokenTypeEnum } from '../src/jwt/enums/token-type.enum';
import { JwtService } from '../src/jwt/jwt.service';
import { OAuthProvidersEnum } from '../src/users/enums/oauth-providers.enum';
import { IUser } from '../src/users/interfaces/user.interface';
import { UsersService } from '../src/users/users.service';
import type { FastifyInstance } from 'fastify';
import { MailerService } from '../src/mailer/mailer.service';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication,
    mailerService: MailerService,
    jwtService: JwtService,
    usersService: UsersService,
    commonService: CommonService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    mailerService = app.get(MailerService);
    jest.spyOn(mailerService, 'sendEmail').mockImplementation();
    jest.spyOn(mailerService, 'sendResetPasswordEmail').mockImplementation();

    jwtService = app.get(JwtService);
    usersService = app.get(UsersService);
    commonService = app.get(CommonService);

    const configService = app.get(ConfigService);
    const fastifyInstance = app.getHttpAdapter().getInstance() as FastifyInstance;

    await fastifyInstance.register(fastifyCookie, {
      secret: configService.get<string>('COOKIE_SECRET'),
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  const name = faker.person.firstName();
  const email = faker.internet.email().toLowerCase();
  const password = faker.internet.password({ length: 10 }) + 'A1!';
  const newEmail = faker.internet.email().toLowerCase();

  const mockUser = {
    id: 1,
    name,
    email,
    credentials: {
      version: 0,
    },
  } as IUser;

  describe('api/auth', () => {
    const baseUrl = '/api/auth';

    describe('sign-up', () => {
      const signUpUrl = `${baseUrl}/sign-up`;

      it('should throw 400 error if email is missing', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if name is missing', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            email,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password1 is missing', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password2 is missing', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password1: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password1 and password2 do not match', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password1: password,
            password2: faker.internet.password({ length: 10 }),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if email is invalid', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email: 'test',
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password is too short', async () => {
        const newPassword = faker.internet.password({ length: 5 });
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password1: newPassword,
            password2: newPassword,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if name has symbols', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name: 'test!',
            email,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should create a new user', async () => {
        const response = await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.CREATED);
        expect(response.body).toMatchObject({
          id: expect.any(String),
          message: 'Registration successful',
        });
      });
    });

    describe('confirm-email', () => {
      const confirmEmailUrl = `${baseUrl}/confirm-email`;

      it('should throw 400 error if token is missing', async () => {
        await request(app.getHttpServer())
          .post(confirmEmailUrl)
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if token is invalid', async () => {
        await request(app.getHttpServer())
          .post(confirmEmailUrl)
          .send({
            confirmationToken: 'test',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should confirm the user', async () => {
        const confirmationToken = await jwtService.generateToken(
          mockUser,
          TokenTypeEnum.CONFIRMATION,
        );
        const response = await request(app.getHttpServer())
          .post(confirmEmailUrl)
          .send({
            confirmationToken,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
        mockUser.credentials.version = 1;
      });
    });

    describe('sign-in', () => {
      const signInUrl = `${baseUrl}/sign-in`;

      it('should throw 400 error if email or username is missing', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password is missing', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: email,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if email is invalid', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: 'test@test',
            password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if username is too long', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: faker.internet.username().repeat(100),
            password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 401 error if user is not confirmed', async () => {
        const newName = faker.person.firstName();
        await usersService.create(
          OAuthProvidersEnum.LOCAL,
          newEmail,
          newName,
          password,
        );

        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: newEmail,
            password,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should throw 401 error if password is incorrect', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: email,
            password: faker.internet.password({ length: 10 }),
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should sign in the user with email', async () => {
        const response = await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: email,
            password,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });

      it('should sign in the user with username', async () => {
        const user = await usersService.findOneById(mockUser.id);
        const response = await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: user.username,
            password,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });
    });

    describe('logout', () => {
      const logoutUrl = `${baseUrl}/logout`;

      it('should throw 401 if user is not signed in', async () => {
        await request(app.getHttpServer())
          .post(logoutUrl)
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should logout the user with cookie', async () => {
        const signInRes = await request(app.getHttpServer())
          .post(`${baseUrl}/sign-in`)
          .send({
            emailOrUsername: email,
            password,
          })
          .expect(HttpStatus.OK);

        await request(app.getHttpServer())
          .post(logoutUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .expect(HttpStatus.OK);
      });

      it('should logout the user with refresh body', async () => {
        const user = await usersService.findOneByEmail(email);
        const [accessToken, refreshToken] =
          await jwtService.generateAuthTokens(user);
        return request(app.getHttpServer())
          .post(logoutUrl)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ refreshToken })
          .expect(HttpStatus.OK);
      });
    });

    describe('forgot-password', () => {
      const forgotPasswordUrl = `${baseUrl}/forgot-password`;

      it('should throw 400 if email is missing', async () => {
        await request(app.getHttpServer())
          .post(forgotPasswordUrl)
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 if email is invalid', async () => {
        await request(app.getHttpServer())
          .post(forgotPasswordUrl)
          .send({
            email: 'test@test',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 200 even if user is not found', async () => {
        const response = await request(app.getHttpServer())
          .post(forgotPasswordUrl)
          .send({
            email: faker.internet.email().toLowerCase(),
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          message: 'Reset password email sent',
        });
        expect(mailerService.sendResetPasswordEmail).not.toHaveBeenCalled();
      });

      it('should send forgot password email', async () => {
        const response = await request(app.getHttpServer())
          .post(forgotPasswordUrl)
          .send({
            email,
          })
          .expect(HttpStatus.OK);
        expect(response.body).toMatchObject({
          id: expect.any(String),
          message: 'Reset password email sent',
        });
        expect(mailerService.sendResetPasswordEmail).toHaveBeenCalled();
      });
    });

    const newPassword = faker.internet.password({ length: 10 }) + 'A1!';
    describe('reset-password', () => {
      const resetPasswordUrl = `${baseUrl}/reset-password`;

      it('should throw 400 if token is missing', async () => {
        await request(app.getHttpServer())
          .post(resetPasswordUrl)
          .send({
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 if token is invalid', async () => {
        await request(app.getHttpServer())
          .post(resetPasswordUrl)
          .send({
            resetToken: 'invalid-token',
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reset password', async () => {
        const resetToken = await jwtService.generateToken(
          mockUser,
          TokenTypeEnum.RESET_PASSWORD,
        );
        const response = await request(app.getHttpServer())
          .post(resetPasswordUrl)
          .send({
            resetToken,
            password1: newPassword,
            password2: newPassword,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          message: 'Password reset successfully',
        });
      });
    });

    describe('update-password', () => {
      const updatePasswordUrl = `${baseUrl}/update-password`;

      it('should throw 401 if user is not signed in', async () => {
        await request(app.getHttpServer())
          .patch(updatePasswordUrl)
          .send({
            password: newPassword,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should throw 400 if password is missing', async () => {
        const signInRes = await request(app.getHttpServer())
          .post(`${baseUrl}/sign-in`)
          .send({
            emailOrUsername: email,
            password: newPassword,
          })
          .expect(HttpStatus.OK);

        await request(app.getHttpServer())
          .patch(updatePasswordUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 if password is invalid', async () => {
        const signInRes = await request(app.getHttpServer())
          .post(`${baseUrl}/sign-in`)
          .send({
            emailOrUsername: email,
            password: newPassword,
          })
          .expect(HttpStatus.OK);

        await request(app.getHttpServer())
          .patch(updatePasswordUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            password: 'invalid-password',
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should change password', async () => {
        const signInRes = await request(app.getHttpServer())
          .post(`${baseUrl}/sign-in`)
          .send({
            emailOrUsername: email,
            password: newPassword,
          })
          .expect(HttpStatus.OK);

        const response = await request(app.getHttpServer())
          .patch(updatePasswordUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            password: newPassword,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });
    });

    describe('refresh-access', () => {
      const refreshPath = `${baseUrl}/refresh-access`;

      it('should return 200 OK with auth response with the refresh token in the cookies', async () => {
        const signInRes = await request(app.getHttpServer())
          .post(`${baseUrl}/sign-in`)
          .send({
            emailOrUsername: email,
            password,
          })
          .expect(HttpStatus.OK);

        return request(app.getHttpServer())
          .post(refreshPath)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(res.body).toMatchObject({
              accessToken: expect.any(String),
              refreshToken: expect.any(String),
              expiresIn: expect.any(Number),
              tokenType: 'Bearer',
              user: {
                id: expect.any(Number),
                name: commonService.formatName(name),
                username: commonService.generatePointSlug(name),
                email,
              },
            });
          });
      });

      it('should return 200 OK with auth response with the refresh token in the body', async () => {
        const user = await usersService.findOneByEmail(email);
        const [accessToken, refreshToken] =
          await jwtService.generateAuthTokens(user);
        return request(app.getHttpServer())
          .post(refreshPath)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ refreshToken })
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(res.body).toMatchObject({
              accessToken: expect.any(String),
              refreshToken: expect.any(String),
              expiresIn: expect.any(Number),
              tokenType: 'Bearer',
              user: {
                id: expect.any(Number),
                name: commonService.formatName(name),
                username: commonService.generatePointSlug(name),
                email,
              },
            });
          });
      });

      it('should return 401 UNAUTHORIZED when refresh token is not passed', async () => {
        const user = await usersService.findOneByEmail(email);
        const [accessToken] = await jwtService.generateAuthTokens(user);

        return request(app.getHttpServer())
          .post(refreshPath)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('api/users', () => {
    const baseUrl = '/api/users';

    describe('find-user', () => {
      it('should throw 404 if id is not found', async () => {
        await request(app.getHttpServer())
          .get(baseUrl + Math.floor(Math.random() * 1000))
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should throw 404 if username is not found', async () => {
        await request(app.getHttpServer())
          .get(baseUrl + '/invalid-username')
          .expect(HttpStatus.NOT_FOUND);
      });

      let username: string;
      it('should get user by id', async () => {
        const response = await request(app.getHttpServer())
          .get(baseUrl + '/' + mockUser.id)
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          username: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });

        username = response.body.username;
      });

      it('should get user by username', async () => {
        const response = await request(app.getHttpServer())
          .get(baseUrl + '/' + username)
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          username: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
    });

    const newEmail2 = faker.internet.email().toLowerCase();
    describe('email', () => {
      const emailUrl = `${baseUrl}/email`;
      let signInRes: request.Response;
      let confirmationToken: string;

      beforeAll(async () => {
        signInRes = await request(app.getHttpServer())
          .post('/api/auth/sign-in')
          .send({
            emailOrUsername: email,
            password,
          })
          .expect(HttpStatus.OK);
      });

      it('should throw 400 if email is missing', async () => {
        await request(app.getHttpServer())
          .patch(emailUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({ password })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 if email is invalid', async () => {
        await request(app.getHttpServer())
          .patch(emailUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({ email: 'invalid-email', password })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 if password is missing', async () => {
        await request(app.getHttpServer())
          .patch(emailUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({ email: email })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 409 if email is already in use', async () => {
        await request(app.getHttpServer())
          .patch(emailUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            email: newEmail,
            password,
          })
          .expect(HttpStatus.CONFLICT);
      });

      it('should throw 400 if email is the same', async () => {
        await request(app.getHttpServer())
          .patch(emailUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            email,
            password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should send a confirmation token to the new email and confirm it', async () => {
        await request(app.getHttpServer())
          .patch(emailUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({ email: newEmail2, password })
          .expect(HttpStatus.OK);

        const user = await usersService.findOneByEmail(email);
        user.email = newEmail2;
        confirmationToken = await jwtService.generateToken(
          user,
          TokenTypeEnum.CONFIRMATION
        );
      });

      it('should confirm the new email', async () => {
        const response = await request(app.getHttpServer())
          .post("/api/auth/confirm-email")
          .send({ confirmationToken })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });
    });

    describe('update', () => {
      let signInRes: request.Response;

      beforeAll(async () => {
        signInRes = await request(app.getHttpServer())
          .post('/api/auth/sign-in')
          .send({
            emailOrUsername: newEmail2,
            password: password,
          })
          .expect(HttpStatus.OK);
      });

      it('should throw 400 body is empty', async () => {
        await request(app.getHttpServer())
          .patch(baseUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('update name', async () => {
        const newName = faker.person.firstName();
        const response = await request(app.getHttpServer())
          .patch(baseUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            name: newName,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          id: expect.any(Number),
          name: commonService.formatName(newName),
          username: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });

      it('update username', async () => {
        const newUsername = commonService.generatePointSlug(
          faker.person.firstName(),
        );
        const response = await request(app.getHttpServer())
          .patch(baseUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            username: newUsername,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          username: newUsername,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
    });

    describe('delete', () => {
      let signInRes: request.Response;

      beforeAll(async () => {
        signInRes = await request(app.getHttpServer())
          .post('/api/auth/sign-in')
          .send({
            emailOrUsername: newEmail2,
            password: password,
          })
          .expect(HttpStatus.OK);
      });

      it('should throw a 401 if not authenticated', async () => {
        await request(app.getHttpServer())
          .delete(baseUrl)
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should throw a 400 if password is missing', async () => {
        await request(app.getHttpServer())
          .delete(baseUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw a 400 if password is wrong', async () => {
        await request(app.getHttpServer())
          .delete(baseUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            password: faker.internet.password(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should delete the user', async () => {
        await request(app.getHttpServer())
          .delete(baseUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            password,
          })
          .expect(HttpStatus.NO_CONTENT);
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
