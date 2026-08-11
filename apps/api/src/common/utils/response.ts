export type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ErrorResponse = {
  success: false;
  message: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>(data: T, message = "OK"): SuccessResponse<T> {
  return { success: true, message, data };
}

export function errorResponse(message: string): ErrorResponse {
  return { success: false, message };
}
