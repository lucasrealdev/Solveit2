import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { Public } from '../auth/decorators/public.decorator';
import { FastifyThrottlerGuard } from '../auth/guards/fastify-throttler.guard';
import { AuthResponseMapper } from '../auth/mappers/auth-response.mapper';
import { OAuthProvidersEnum } from '../users/enums/oauth-providers.enum';
import { CallbackQueryDto } from './dtos/callback-query.dto';
import { TokenDto } from './dtos/token.dto';
import { OAuthFlagGuard } from './guards/oauth-flag.guard';
import {
  IFacebookUser,
  IGoogleUser,
} from './interfaces/user-response.interface';
import { Oauth2Service } from './oauth2.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Oauth2')
@Controller('api/auth/ext')
@UseGuards(FastifyThrottlerGuard)
export class Oauth2Controller {
  private readonly url: string;
  private readonly cookiePath = '/api/auth';
  private readonly cookieName: string;
  private readonly refreshTime: number;
  private readonly testing: boolean;

  constructor(
    private readonly oauth2Service: Oauth2Service,
    private readonly configService: ConfigService,
  ) {
    this.url = `https://${this.configService.get<string>('domain')}`;
    this.cookieName = this.configService.get<string>('REFRESH_COOKIE');
    this.refreshTime = this.configService.get<number>('jwt.refresh.time');
    this.testing = this.configService.get<boolean>('testing');
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GOOGLE))
  @Get('google/url')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns Google OAuth2 login URL',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://accounts.google.com/o/oauth2/v2/auth?...' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for Google',
  })
  public async googleUrl() {
    const url = await this.oauth2Service.getAuthorizationUrl(OAuthProvidersEnum.GOOGLE);
    return { url };
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GOOGLE))
  @Get('google/callback')
  @ApiResponse({
    description: 'Redirects to the frontend with the JWT token',
    status: HttpStatus.FOUND,
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for Google',
  })
  public async googleCallback(
    @Query() cbQuery: CallbackQueryDto,
    @Res() res: FastifyReply,
  ): Promise<FastifyReply> {
    const provider = OAuthProvidersEnum.GOOGLE;

    const { name, email } = await this.oauth2Service.getUserData<IGoogleUser>(
      provider,
      cbQuery,
    );

    return this.callbackAndRedirect(res, provider, email, name);
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.FACEBOOK))
  @Get('facebook/url')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns Facebook OAuth2 login URL',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://www.facebook.com/v10.0/dialog/oauth?...' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for Facebook',
  })
  public async facebookUrl() {
    const url = await this.oauth2Service.getAuthorizationUrl(OAuthProvidersEnum.FACEBOOK);
    return { url };
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.FACEBOOK))
  @Get('facebook/callback')
  @ApiResponse({
    description: 'Redirects to the frontend with the JWT token',
    status: HttpStatus.FOUND,
  })
  @ApiNotFoundResponse({
    description: 'OAuth2 is not enabled for Facebook',
  })
  public async facebookCallback(
    @Query() cbQuery: CallbackQueryDto,
    @Res() res: FastifyReply,
  ): Promise<FastifyReply> {
    const provider = OAuthProvidersEnum.FACEBOOK;
    const { name, email } = await this.oauth2Service.getUserData<IFacebookUser>(
      provider,
      cbQuery,
    );
    return this.callbackAndRedirect(res, provider, email, name);
  }

  @Post('token')
  @ApiBearerAuth('access-token')
  @ApiResponse({
    description: "Returns the user's OAuth 2 response",
    status: HttpStatus.OK,
  })
  @ApiUnauthorizedResponse({
    description: 'Code or redirectUri is invalid',
  })
  public async token(
    @CurrentUser() userId: number,
    @Body() tokenDto: TokenDto,
    @Res() res: FastifyReply,
  ): Promise<void> {
    if (tokenDto.redirectUri !== this.url + '/auth/callback') {
      throw new UnauthorizedException();
    }

    const result = await this.oauth2Service.token(tokenDto.code, userId);
    return res
      .cookie(this.cookieName, result.refreshToken, {
        secure: !this.testing,
        httpOnly: true,
        signed: true,
        path: this.cookiePath,
        expires: new Date(Date.now() + this.refreshTime * 1000),
      })
      .header('Content-Type', 'application/json')
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  private async callbackAndRedirect(
    res: FastifyReply,
    provider: OAuthProvidersEnum,
    email: string,
    name: string,
  ): Promise<FastifyReply> {
    const { code, accessToken, expiresIn } = await this.oauth2Service.callback(
      provider,
      email,
      name,
    );
    const urlSearchParams = new URLSearchParams({
      code,
      accessToken,
      tokenType: 'Bearer',
      expiresIn: expiresIn.toString(),
    });

    return res
      .status(HttpStatus.FOUND)
      .redirect(`${this.url}/auth/callback?${urlSearchParams.toString()}`);
  }
}
