import { IAuthResponseUser } from './auth-response-user.interface';

export interface IAuthResponse {
  user: IAuthResponseUser;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
