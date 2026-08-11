const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ApiResponse<T> =
  { success: true; message: string; data: T } | { success: false; message: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body: ApiResponse<T> = await res.json();

  if (!body.success) {
    throw new Error(body.message);
  }
  return body.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
