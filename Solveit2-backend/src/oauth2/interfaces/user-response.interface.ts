export interface IGoogleUser {
  readonly sub: string;
  readonly name: string;
  readonly given_name: string;
  readonly family_name: string;
  readonly picture: string;
  readonly email: string;
  readonly email_verified: boolean;
  readonly locale: string;
  readonly hd: string;
}

export interface IFacebookUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}
