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
import { OAuthProvidersEnum } from '../src/users/enums/oauth-providers.enum';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Oauth2Service } from '../src/oauth2/oauth2.service';
import nock from 'nock';
import { faker } from '@faker-js/faker';
import { CommonService } from '../src/common/common.service';
import { isJWT } from 'class-validator';
import type { FastifyInstance } from 'fastify';

const URLS = {
  [OAuthProvidersEnum.GOOGLE]: {
    authorizeHost: 'https://accounts.google.com',
    authorizePath: '/o/oauth2/v2/auth',
    tokenHost: 'https://www.googleapis.com',
    tokenPath: '/oauth2/v4/token',
    userUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
  },
  [OAuthProvidersEnum.FACEBOOK]: {
    authorizeHost: 'https://www.facebook.com',
    authorizePath: '/v9.0/dialog/oauth',
    tokenHost: 'https://graph.facebook.com',
    tokenPath: '/v13.0/oauth/access_token',
    userUrl: 'https://graph.facebook.com/me',
  },
};

describe('OAuth2 (e2e)', () => {
  let googleConfigExists: boolean;
  let facebookConfigExists: boolean;
  let app: NestFastifyApplication,
    configService: ConfigService,
    cacheManager: Cache,
    oauth2Service: Oauth2Service,
    commonService: CommonService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    configService = app.get(ConfigService);
    cacheManager = app.get<Cache>(CACHE_MANAGER);
    oauth2Service = app.get(Oauth2Service);
    commonService = app.get(CommonService);
    const fastifyInstance = app.getHttpAdapter().getInstance() as FastifyInstance;

    await fastifyInstance.register(fastifyCookie, {
      secret: configService.get<string>('COOKIE_SECRET'),
    });

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

    googleConfigExists = !!configService.get('oauth2.google');
    facebookConfigExists = !!configService.get('oauth2.facebook');

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  const baseUrl = '/api/auth/ext';

  describe.each([
    OAuthProvidersEnum.GOOGLE,
    OAuthProvidersEnum.FACEBOOK,
  ])('%s Provider', (provider) => {

    const runTestIfConfigExists = (
      provider: OAuthProvidersEnum,
      testFn: () => Promise<void>
    ) => {
      return async () => {
        const configExists =
          provider === OAuthProvidersEnum.GOOGLE ? googleConfigExists : facebookConfigExists;

        if (!configExists) {
          console.log(`⚠️ Skipped test for ${provider} because configuration does not exist.`);
          return;
        }

        await testFn();
      };
    };

    describe(`GET /api/auth/ext/${provider}/url`, () => {
      it('should return 200 and a valid authorization URL',
        runTestIfConfigExists(provider, async () => {
          const authorizationUrl = `${baseUrl}/${provider}/url`;
          const expectedBaseUrl = URLS[provider].authorizeHost + URLS[provider].authorizePath;

          await request(app.getHttpServer())
            .get(authorizationUrl)
            .expect(HttpStatus.OK)
            .expect((res) => {
              expect(res.body).toHaveProperty('url');
              expect(res.body.url.startsWith(expectedBaseUrl)).toBe(true);
            });
        }));
    });

    describe(`GET /api/auth/ext/${provider}/callback`, () => {
      const callbackPath = `${baseUrl}/${provider}/callback`;
      const state = 'd624ca894960603ee85a7e8972feef5b';
      const code = '4/0AQSTgQELDiidH43r0D2NkigmMGN07uV6dcJ8f9LfyuXx9k3A5ZLZ0EUloiv2Jgln2e4ypQ';
      const accessToken = 'some-access-token';
      const refreshToken = 'some-refresh-token';

      const host = URLS[provider].tokenHost;
      const path = URLS[provider].tokenPath;
      const userUrl = URLS[provider].userUrl;

      const name = faker.person.fullName();
      const email = faker.internet.email().toLowerCase();

      it('should return 302 FOUND and redirect with code', runTestIfConfigExists(provider, async () => {
        const frontendUrl = `https://${configService.get<string>('domain')}/auth/callback`;
        await cacheManager.set(`oauth_state:${state}`, provider, 120_000);
        const tokenScope = nock(host, {
          reqheaders: {
            accept: 'application/json',
            'content-type': 'application/x-www-form-urlencoded',
          },
        })
          .post(
            path,
            (body) =>
              body.grant_type === 'authorization_code' &&
              body.code === code &&
              body.redirect_uri.includes(callbackPath),
          )
          .reply(200, {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: refreshToken,
          });

        const userScope = nock(userUrl, {
          reqheaders: {
            accept: 'application/json',
            authorization: `Bearer ${accessToken}`,
          },
        })
          .get('')
          .reply(200, { name, email });

        await request(app.getHttpServer())
          .get(`${callbackPath}?code=${code}&state=${state}`)
          .expect(HttpStatus.FOUND)
          .expect((res) => {
            expect(res.headers.location.startsWith(frontendUrl)).toBe(true);

            const queryParams = res.headers.location.split('?')[1];
            const searchParams = new URLSearchParams(queryParams);

            expect(searchParams.get('code')).toHaveLength(22);
            expect(isJWT(searchParams.get('accessToken'))).toBe(true);
            expect(searchParams.get('tokenType')).toBe('Bearer');
            expect(searchParams.has('expiresIn')).toBe(true);
          });

        expect(tokenScope.isDone()).toBe(true);
        expect(userScope.isDone()).toBe(true);
      }));

      it('should return 401 unauthorized when the code is wrong', runTestIfConfigExists(provider, async () => {
        await cacheManager.set(`oauth_state:${state}`, provider, 120_000);
        const tokenScope = nock(host, {
          reqheaders: {
            accept: 'application/json',
            'content-type': 'application/x-www-form-urlencoded',
          },
        })
          .post(
            path,
            (body) =>
              body.grant_type === 'authorization_code' &&
              body.code === code &&
              body.redirect_uri.includes(callbackPath),
          )
          .reply(401, { code: 'Unauthorized' });

        await request(app.getHttpServer())
          .get(`${callbackPath}?code=${code}&state=${state}`)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(tokenScope.isDone()).toBe(true);
      }));

      it('should return 401 unauthorized when the state is expired or non-existent', runTestIfConfigExists(provider, async () => {
        await cacheManager.del(`oauth_state:${state}`);
        const tokenScope = nock(host, {
          reqheaders: {
            accept: 'application/json',
            'content-type': 'application/x-www-form-urlencoded',
          },
        })
          .post(
            path,
            (body) =>
              body.grant_type === 'authorization_code' &&
              body.code === code &&
              body.redirect_uri.includes(callbackPath),
          )
          .reply(200);

        await request(app.getHttpServer())
          .get(`${callbackPath}?code=${code}&state=${state}`)
          .expect(HttpStatus.UNAUTHORIZED);

        expect(tokenScope.isDone()).toBe(false);
      }));
    });

    describe('POST /api/auth/ext/token', () => {
      const tokenPath = `${baseUrl}/token`;
      const name = faker.person.fullName();
      const email = faker.internet.email().toLowerCase();

      it('should return 200 OK with access and refresh token', async () => {
        const redirectUri = `https://${configService.get<string>('domain')}/auth/callback`;
        const { accessToken, code } = await oauth2Service.callback(
          provider,
          email,
          name,
        );

        return request(app.getHttpServer())
          .post(tokenPath)
          .set('Authorization', `Bearer ${accessToken}`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send(new URLSearchParams({ code, redirectUri }).toString())
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

      it('should return 401 UNAUTHORIZED when the code is expired', async () => {
        const redirectUri = `https://${configService.get<string>('domain')}/auth/callback`;
        const { accessToken, code } = await oauth2Service.callback(
          provider,
          email,
          name,
        );
        await cacheManager.del(`oauth_code:${code}`);

        return request(app.getHttpServer())
          .post(tokenPath)
          .set('Authorization', `Bearer ${accessToken}`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send(new URLSearchParams({ code, redirectUri }).toString())
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should return 401 UNAUTHORIZED when the user is not authenticated', async () => {
        const redirectUri = `https://${configService.get<string>('domain')}/auth/callback`;
        const { code } = await oauth2Service.callback(provider, email, name);

        return request(app.getHttpServer())
          .post(tokenPath)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send(new URLSearchParams({ code, redirectUri }).toString())
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should return 401 UNAUTHORIZED when the redirectUri is wrong', async () => {
        const redirectUri = `https://not-the-correct-url.com/auth/callback`;
        const { accessToken, code } = await oauth2Service.callback(
          provider,
          email,
          name,
        );

        return request(app.getHttpServer())
          .post(tokenPath)
          .set('Authorization', `Bearer ${accessToken}`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send(new URLSearchParams({ code, redirectUri }).toString())
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(async () => {
    await app.close();
  });
});
