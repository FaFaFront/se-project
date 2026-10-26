export type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ErrorResponse = {
  success: false;
  message: string;
  code?: string;
  data?: unknown;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>(data: T, message = "OK"): SuccessResponse<T> {
  return { success: true, message, data };
}

export function errorResponse(message: string, code?: string, data?: unknown): ErrorResponse {
  return {
    success: false,
    message,
    ...(code !== undefined && { code }),
    ...(data !== undefined && { data }),
  };
}
