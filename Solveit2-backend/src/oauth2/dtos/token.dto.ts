import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, Length } from 'class-validator';

export abstract class TokenDto {
  @ApiProperty({
    description: 'The Code to exchange for a token',
    example: '5WA0R4DVyWThKFnc73z7nT',
    minLength: 1,
    maxLength: 22,
    type: String,
  })
  @IsString()
  @Length(1, 22)
  public code: string;

  @ApiProperty({
    description: 'Redirect URI that was used to get the token',
    example: 'https://example.com/auth/callback',
    type: String,
  })
  @IsString()
  @IsUrl()
  public redirectUri: string;
}
