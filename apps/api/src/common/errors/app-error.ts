export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    /** Machine-readable code for errors the client must tell apart from others with the same status. */
    public readonly code?: string,
    /** Extra details returned to the client alongside `code`. */
    public readonly data?: unknown
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class ConfigurationError extends AppError {
  constructor(message = "Server configuration error") {
    super(message, 500);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "External service error", statusCode = 502) {
    super(message, statusCode);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(details: { required: string; available: string }) {
    super("Insufficient balance to join this session", 402, "INSUFFICIENT_BALANCE", details);
  }
}
