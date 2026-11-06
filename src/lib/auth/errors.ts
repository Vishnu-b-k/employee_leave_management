export class AuthError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 401, code: string = "AUTH_UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class AuthorizationError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, code: string = "AUTH_FORBIDDEN") {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 403;
    this.code = code;
  }
}

export class InactiveUserError extends AuthorizationError {
  constructor(message: string = "Account is inactive. Access denied.") {
    super(message, "USER_INACTIVE");
  }
}
