const API_URL = '/api';

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const REQUEST_TIMEOUT_MS = 7000;

function timeoutError() {
  return new ApiError('La solicitud tardó demasiado. Intenta nuevamente.', 408);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw timeoutError();
    throw new ApiError('No pudimos conectar con el servidor. Intenta nuevamente.');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const apiMessage = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
    if (response.status === 401) throw new ApiError(apiMessage ?? 'Tu sesión expiró.', 401);
    if (response.status === 404) throw new ApiError(apiMessage ?? 'Lead no encontrado.', 404);
    throw new ApiError(apiMessage ?? 'No pudimos completar la operación.', response.status);
  }
  return response.json() as Promise<T>;
}
