import { CredentialsSignin } from 'next-auth';

export class CouldNotParseError extends CredentialsSignin {}

export class MemberNotFoundError extends CredentialsSignin {}

export class MemberNotActiveError extends CredentialsSignin {}

export class InvalidCredentialsError extends CredentialsSignin {
  constructor() {
    super('Invalid credentials');
  }
  public getMessage() {
    return this.message;
  }
}
