import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { IMessage } from '../common/interfaces/message.interface';
import { MessageMapper } from '../common/mappers/message.mapper';
import { isNull, isUndefined } from '../common/utils/validation.util';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { EmailDto } from './dtos/email.dto';
import { RefreshAccessDto } from './dtos/refresh-access.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { FastifyThrottlerGuard } from './guards/fastify-throttler.guard';
import { IAuthResponseUser } from './interfaces/auth-response-user.interface';
import { IOAuthProvidersResponse } from './interfaces/oauth-provider-response.interface';
import { AuthResponseUserMapper } from './mappers/auth-response-user.mapper';
import { AuthResponseMapper } from './mappers/auth-response.mapper';
import { OAuthProvidersResponseMapper } from './mappers/oauth-provider-response.mapper';

@ApiTags('Auth')
@Controller('api/auth')
@UseGuards(FastifyThrottlerGuard)
export class AuthController {
  private readonly cookiePath = '/api/auth';
  private readonly cookieName: string;
  private readonly refreshTime: number;
  private readonly testing: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.cookieName = this.configService.get<string>('REFRESH_COOKIE');
    this.refreshTime = this.configService.get<number>('jwt.refresh.time');
    this.testing = this.configService.get<boolean>('testing');
  }

  @Public()
  @Post('/sign-up')
  @ApiCreatedResponse({
    type: MessageMapper,
    description: 'The user has been created and is waiting confirmation',
  })
  @ApiConflictResponse({
    description: 'Email already in use',
  })
  @ApiBadRequestResponse({
    description: 'Something is invalid on the request body',
  })
  public async signUp(
    @Body() signUpDto: SignUpDto,
  ): Promise<IMessage> {
    return await this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('/sign-in')
  @ApiOkResponse({
    type: AuthResponseMapper,
    description: 'Logs in the user and returns the access token',
  })
  @ApiBadRequestResponse({
    description: 'Something is invalid on the request body',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or User is not confirmed',
  })
  public async signIn(
    @Res() res: FastifyReply,
    @Body() singInDto: SignInDto,
  ): Promise<void> {
    const result = await this.authService.signIn(singInDto);
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Public()
  @Post('/refresh-access')
  @ApiOkResponse({
    type: AuthResponseMapper,
    description: 'Refreshes and returns the access token',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
  })
  @ApiBadRequestResponse({
    description:
      'Something is invalid on the request body, or Token is invalid or expired',
  })
  public async refreshAccess(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() refreshAccessDto?: RefreshAccessDto,
  ): Promise<void> {
    const token = this.refreshTokenFromReq(req, refreshAccessDto);
    const result = await this.authService.refreshTokenAccess(
      token
    );
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Post('/logout')
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    type: MessageMapper,
    description: 'The user is logged out',
  })
  @ApiBadRequestResponse({
    description: 'Something is invalid on the request body',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
  })
  public async logout(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() refreshAccessDto?: RefreshAccessDto,
  ): Promise<void> {
    const token = this.refreshTokenFromReq(req, refreshAccessDto);
    const message = await this.authService.logout(token);
    res
      .clearCookie(this.cookieName, { path: this.cookiePath })
      .header('Content-Type', 'application/json')
      .status(HttpStatus.OK)
      .send(message);
  }

  @Public()
  @Post('/confirm-email')
  @ApiOkResponse({
    type: AuthResponseMapper,
    description: 'Confirms the user email and returns the access token',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
  })
  @ApiBadRequestResponse({
    description:
      'Something is invalid on the request body, or Token is invalid or expired',
  })
  public async confirmEmail(
    @Body() confirmEmailDto: ConfirmEmailDto,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const result = await this.authService.confirmEmail(confirmEmailDto);
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Public()
  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: MessageMapper,
    description:
      'An email has been sent to the user with the reset password link',
  })
  public async forgotPassword(
    @Body() emailDto: EmailDto,
  ): Promise<IMessage> {
    return this.authService.resetPasswordEmail(emailDto);
  }

  @Public()
  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: MessageMapper,
    description: 'The password has been reset',
  })
  @ApiBadRequestResponse({
    description:
      'Something is invalid on the request body, or Token is invalid or expired',
  })
  public async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<IMessage> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Patch('/update-password')
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    type: AuthResponseMapper,
    description: 'The password has been updated',
  })
  @ApiUnauthorizedResponse({
    description: 'The user is not logged in.',
  })
  public async updatePassword(
    @CurrentUser() userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const result = await this.authService.updatePassword(
      userId,
      changePasswordDto,
    );
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Get('/me')
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    type: AuthResponseUserMapper,
    description: 'The user is found and returned.',
  })
  @ApiUnauthorizedResponse({
    description: 'The user is not logged in.',
  })
  public async getMe(@CurrentUser() id: number): Promise<IAuthResponseUser> {
    const user = await this.usersService.findOneById(id);
    return AuthResponseUserMapper.map(user);
  }

  @Get('/providers')
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    type: OAuthProvidersResponseMapper,
    description: 'The OAuth providers are returned.',
  })
  @ApiUnauthorizedResponse({
    description: 'The user is not logged in.',
  })
  public async getOAuthProviders(
    @CurrentUser() id: number,
  ): Promise<IOAuthProvidersResponse> {
    const providers = await this.usersService.findOAuthProviders(id);
    return OAuthProvidersResponseMapper.map(providers);
  }

  private refreshTokenFromReq(
    req: FastifyRequest,
    dto?: RefreshAccessDto,
  ): string {
    const token: string | undefined = req.cookies[this.cookieName];

    if (isUndefined(token) || isNull(token)) {
      if (!isUndefined(dto?.refreshToken)) {
        return dto.refreshToken;
      }

      throw new UnauthorizedException();
    }

    const { valid, value } = req.unsignCookie(token);

    if (!valid) {
      throw new UnauthorizedException();
    }

    return value;
  }

  private saveRefreshCookie(
    res: FastifyReply,
    refreshToken: string,
  ): FastifyReply {
    return res
      .cookie(this.cookieName, refreshToken, {
        secure: !this.testing,
        httpOnly: true,
        signed: true,
        path: this.cookiePath,
        expires: new Date(Date.now() + this.refreshTime * 1000),
      })
      .header('Content-Type', 'application/json');
  }
}
