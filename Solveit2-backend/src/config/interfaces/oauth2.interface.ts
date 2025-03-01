import { IClient } from '../../oauth2/interfaces/client.interface';

export interface IOAuth2 {
  readonly google: IClient | null;
  readonly facebook: IClient | null;
}
